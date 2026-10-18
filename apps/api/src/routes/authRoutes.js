import { Router } from 'express';
import { register, login, refresh, oauthCallback } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', authenticate, refresh);
router.get('/oauth/callback', oauthCallback);

export { router as authRoutes };
