import jwt from 'jsonwebtoken';

const allowDevAuth = process.env.ALLOW_DEV_AUTH === 'true' || process.env.NODE_ENV !== 'production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    if (allowDevAuth) {
      req.user = { sub: 1 };
      return next();
    }

    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export const protect = authenticateToken;
