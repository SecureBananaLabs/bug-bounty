import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { register, login, oauthCallback, refresh } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/oauth/callback', oauthCallback);
authRoutes.post('/refresh', authenticate, refresh);
