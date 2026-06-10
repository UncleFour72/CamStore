import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Op } from 'sequelize';
import { Address, PasswordResetToken, User, UserIdentity, sequelize } from '../models/index.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { signToken } from '../utils/jwt.js';

const pick = (source, keys) => {
  return keys.reduce((result, key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }

    return result;
  }, {});
};

const parseRegisterNames = (body) => {
  if (body.first_name && body.last_name) {
    return {
      first_name: String(body.first_name).trim(),
      last_name: String(body.last_name).trim(),
    };
  }

  const fullName = String(body.name || '').trim();
  const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);

  return {
    first_name: firstName || '',
    last_name: rest.join(' ') || firstName || '',
  };
};

const issueSession = (user) => ({
  user,
  token: signToken(user),
});

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const PASSWORD_RESET_RESPONSE_MESSAGE =
  'If this email exists, a password reset link has been sent';

const getPasswordResetTtlMinutes = () => {
  const value = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30);
  return Number.isFinite(value) && value > 0 ? value : 30;
};

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

const buildResetPasswordUrl = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const url = new URL('/reset-password', frontendUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

let googleClient = null;

const getGoogleClient = () => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw createHttpError(503, 'Google login is not configured');
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(clientId);
  }

  return googleClient;
};

const splitName = ({ firstName, lastName, name, email }) => {
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();

  if (first && last) {
    return {
      first_name: first,
      last_name: last,
    };
  }

  const fallbackName = String(name || email?.split('@')[0] || 'CamStore Customer').trim();
  const [parsedFirst, ...rest] = fallbackName.split(/\s+/).filter(Boolean);

  return {
    first_name: first || parsedFirst || 'CamStore',
    last_name: last || rest.join(' ') || first || parsedFirst || 'Customer',
  };
};

const findLinkedIdentity = (provider, providerUserId) => {
  return UserIdentity.findOne({
    where: {
      provider,
      provider_user_id: String(providerUserId),
    },
    include: [
      {
        model: User,
        as: 'user',
      },
    ],
  });
};

const ensureCustomerCanUseSocialLogin = (user) => {
  if (!user.is_active) {
    throw createHttpError(403, 'User account is disabled');
  }

  if (user.role !== 'customer') {
    throw createHttpError(403, 'Social login is only available for customer accounts');
  }
};

const findOrCreateSocialUser = async ({
  provider,
  providerUserId,
  email,
  emailVerified = false,
  firstName,
  lastName,
  name,
  avatarUrl,
  metadata = {},
}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw createHttpError(400, `${provider} account did not provide an email address`);
  }

  const existingIdentity = await findLinkedIdentity(provider, providerUserId);

  if (existingIdentity?.user) {
    ensureCustomerCanUseSocialLogin(existingIdentity.user);
    return existingIdentity.user;
  }

  if (!emailVerified) {
    throw createHttpError(400, `${provider} email is not verified`);
  }

  const transaction = await sequelize.transaction();

  try {
    let user = await User.findOne({
      where: { email: normalizedEmail },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (user) {
      ensureCustomerCanUseSocialLogin(user);

      const existingProviderLink = await UserIdentity.findOne({
        where: {
          user_id: user.id,
          provider,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existingProviderLink && String(existingProviderLink.provider_user_id) !== String(providerUserId)) {
        throw createHttpError(409, `${provider} login is already linked to this customer account`);
      }
    } else {
      const names = splitName({ firstName, lastName, name, email: normalizedEmail });
      user = await User.create(
        {
          email: normalizedEmail,
          password: null,
          first_name: names.first_name,
          last_name: names.last_name,
          avatar_url: avatarUrl || null,
          role: 'customer',
          is_active: true,
        },
        { transaction }
      );
    }

    await UserIdentity.create(
      {
        user_id: user.id,
        provider,
        provider_user_id: String(providerUserId),
        provider_email: normalizedEmail,
        metadata,
      },
      { transaction }
    );

    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();

    if (error.name === 'SequelizeUniqueConstraintError') {
      const identity = await findLinkedIdentity(provider, providerUserId);

      if (identity?.user) {
        ensureCustomerCanUseSocialLogin(identity.user);
        return identity.user;
      }
    }

    throw error;
  }
};

const buildFacebookUrl = (path, params = {}) => {
  const version = process.env.FACEBOOK_GRAPH_VERSION || 'v25.0';
  const url = new URL(`https://graph.facebook.com/${version}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
};

const requestFacebookJson = async (path, params = {}) => {
  const response = await fetch(buildFacebookUrl(path, params));
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    throw createHttpError(401, data?.error?.message || 'Facebook token verification failed');
  }

  return data;
};

const buildFacebookInternalEmail = (facebookUserId) => {
  return `facebook_${facebookUserId}@facebook.camstore.local`;
};

export const register = async (req, res, next) => {
  try {
    const { email, password, phone, avatar_url } = req.body;
    const { first_name, last_name } = parseRegisterNames(req.body);

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        message: 'email, password, first_name and last_name are required',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must contain at least 6 characters' });
    }

    const existing = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });

    if (existing) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone: phone || null,
      avatar_url: avatar_url || null,
      role: 'customer',
    });

    return res.status(201).json(issueSession(user));
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is disabled' });
    }

    return res.json(issueSession(user));
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.is_active) {
      return res.json({ message: PASSWORD_RESET_RESPONSE_MESSAGE });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const ttlMinutes = getPasswordResetTtlMinutes();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await PasswordResetToken.update(
      { used_at: new Date() },
      {
        where: {
          user_id: user.id,
          used_at: null,
        },
      }
    );

    const resetToken = await PasswordResetToken.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        resetUrl: buildResetPasswordUrl(token),
        expiresInMinutes: ttlMinutes,
      });
    } catch (mailError) {
      await resetToken.update({ used_at: new Date() });
      console.error('Failed to send password reset email:', mailError);
      throw createHttpError(503, 'Password reset email could not be sent');
    }

    return res.json({ message: PASSWORD_RESET_RESPONSE_MESSAGE });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token = String(req.body.token || '').trim();
    const password = req.body.password || req.body.new_password;

    if (!token || !password) {
      return res.status(400).json({ message: 'token and password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must contain at least 6 characters' });
    }

    const resetToken = await PasswordResetToken.findOne({
      where: {
        token_hash: hashResetToken(token),
        used_at: null,
        expires_at: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    });

    if (!resetToken?.user || !resetToken.user.is_active) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const transaction = await sequelize.transaction();

    try {
      resetToken.user.password = password;
      await resetToken.user.save({ transaction });
      await resetToken.update({ used_at: new Date() }, { transaction });

      await PasswordResetToken.update(
        { used_at: new Date() },
        {
          where: {
            user_id: resetToken.user_id,
            used_at: null,
            id: {
              [Op.ne]: resetToken.id,
            },
          },
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return next(error);
  }
};

export const loginWithGoogle = async (req, res, next) => {
  try {
    const credential = req.body.credential || req.body.id_token;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await getGoogleClient().verifyIdToken({
      idToken: String(credential),
      audience: getGoogleClientId(),
    });
    const payload = ticket.getPayload();

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Invalid Google credential' });
    }

    const user = await findOrCreateSocialUser({
      provider: 'google',
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
      firstName: payload.given_name,
      lastName: payload.family_name,
      name: payload.name,
      avatarUrl: payload.picture,
      metadata: {
        locale: payload.locale,
        hosted_domain: payload.hd,
      },
    });

    return res.json(issueSession(user));
  } catch (error) {
    return next(error);
  }
};

export const loginWithFacebook = async (req, res, next) => {
  try {
    const accessToken = req.body.access_token;
    const appId = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!accessToken) {
      return res.status(400).json({ message: 'Facebook access token is required' });
    }

    if (!appId || !appSecret) {
      return res.status(503).json({ message: 'Facebook login is not configured' });
    }

    const debugData = await requestFacebookJson('/debug_token', {
      input_token: accessToken,
      access_token: `${appId}|${appSecret}`,
    });
    const tokenInfo = debugData.data || {};

    if (!tokenInfo.is_valid || String(tokenInfo.app_id) !== String(appId) || !tokenInfo.user_id) {
      return res.status(401).json({ message: 'Invalid Facebook access token' });
    }

    const profile = await requestFacebookJson('/me', {
      fields: 'id,email,name,first_name,last_name,picture.type(large)',
      access_token: accessToken,
    });

    if (String(profile.id) !== String(tokenInfo.user_id)) {
      return res.status(401).json({ message: 'Facebook token user mismatch' });
    }

    const facebookEmail = profile.email || buildFacebookInternalEmail(profile.id);

    const user = await findOrCreateSocialUser({
      provider: 'facebook',
      providerUserId: profile.id,
      email: facebookEmail,
      emailVerified: true,
      firstName: profile.first_name,
      lastName: profile.last_name,
      name: profile.name,
      avatarUrl: profile.picture?.data?.url,
      metadata: {
        provider_email_missing: !profile.email,
        provider_email: profile.email || null,
        token_expires_at: tokenInfo.expires_at || null,
        data_access_expires_at: tokenInfo.data_access_expires_at || null,
      },
    });

    return res.json(issueSession(user));
  } catch (error) {
    return next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Address,
          as: 'addresses',
          separate: true,
          order: [
            ['is_default', 'DESC'],
            ['created_at', 'DESC'],
          ],
        },
      ],
    });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const payload = pick(req.body, ['first_name', 'last_name', 'phone', 'avatar_url']);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided' });
    }

    await req.user.update(payload);

    return res.json({ user: req.user });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        message: 'current_password and new_password are required',
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({ message: 'New password must contain at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    const passwordMatches = await user.comparePassword(current_password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = new_password;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    return next(error);
  }
};
