import { Router } from 'express';
import { z } from 'zod';
import { generateToken, refreshToken, verifyToken } from '../utils/jwt';
import { RefreshTokenError } from '../errors';

const router = Router();

  password: z.string().min(1),
});

const refreshSchema = z.object({
  token: z.string().min(1),
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const { token } = parsed.data;

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const newAccessToken = generateToken({ sub: decoded.sub, role: decoded.role });

    res.json({ accessToken: newAccessToken, sub: decoded.sub, role: decoded.role });
  } catch (err) {
    next(err);
  }
});

export default router;