import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';

const router = Router();

  password: z.string().min(1),
});

const refreshSchema = z.object({
  token: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = refreshSchema.parse(req.body);
    const decoded = verifyRefreshToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    
    const result = await AuthService.refreshToken({
      sub: decoded.sub,
      role: decoded.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});