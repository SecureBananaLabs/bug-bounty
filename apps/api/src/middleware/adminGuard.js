import { verifyToken } from '../utils/auth.js';

export const adminGuard = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = verifyToken(token);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin required' });
  }

  req.user = user;
  next();
};
