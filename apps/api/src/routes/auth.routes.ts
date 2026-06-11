import { Router } from 'express';
import { z } from 'zod';
import { refreshToken } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';

const router = Router();

  token: z.string().min(1, 'Token is required'),
});

router.post('/refresh', (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const { token } = parsed.data;

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (!decoded.sub || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const newAccessToken = refreshToken(decoded.sub, decoded.role);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
});

export default router;