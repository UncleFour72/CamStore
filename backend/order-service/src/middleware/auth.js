import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const getBearerToken = (req) => {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
};

const verifyJwt = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, secret);
};

export const optionalAuthenticate = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (token) {
      req.auth = verifyJwt(token);
    }

    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authenticate = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    req.auth = verifyJwt(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.auth || req.auth.role !== 'admin') {
    return res.status(403).json({ message: 'Admin permission is required' });
  }

  return next();
};

export const requireInternal = (req, res, next) => {
  const configuredKey = process.env.INTERNAL_API_KEY;
  const requestKey = req.headers['x-internal-api-key'];

  if (!configuredKey || requestKey !== configuredKey) {
    return res.status(403).json({ message: 'Internal service permission is required' });
  }

  return next();
};

export const requireInternalOrAdmin = (req, res, next) => {
  const configuredKey = process.env.INTERNAL_API_KEY;
  const requestKey = req.headers['x-internal-api-key'];

  if (configuredKey && requestKey === configuredKey) {
    req.isInternal = true;
    return next();
  }

  if (req.auth?.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Internal service or admin permission is required' });
};
