import { User } from '../models/index.js';
import { verifyToken } from '../utils/jwt.js';

const getBearerToken = (req) => {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
};

export const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'User is not available' });
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin permission is required' });
  }

  return next();
};
