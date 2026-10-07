import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { generalApiLimiter, loginLimiter } from '../middleware/rateLimiters';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/authController';

const router = Router();

router.post(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  authController.login
);

router.post('/api/auth/register', authController.register);
router.post('/api/auth/logout', authController.logout);
router.get('/api/auth/me', authController.me);

export const authRouter = router;
