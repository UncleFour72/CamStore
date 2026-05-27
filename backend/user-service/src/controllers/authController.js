import { Address, User } from '../models/index.js';
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
