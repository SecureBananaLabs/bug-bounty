import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { register, login, refresh } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', authenticate, refresh);

export const authRoutes = router;
