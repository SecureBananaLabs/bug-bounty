import { Router } from 'express';
import { z } from 'zod';
import { refreshToken } from '../services/auth.service';
import { verifyToken } from '../utils/jwt';

const router = Router();

  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  token: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  // existing login handler
});

router.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Missing or invalid token' });
    }

    const { token } = parsed.data;
    const decoded = verifyToken(token);

    if (!decoded || !decoded.sub || !decoded.role) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const accessToken = await refreshToken(decoded.sub, decoded.role);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

export default router;