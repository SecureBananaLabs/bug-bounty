import { Router } from 'express';
import { register, login } from '../controllers/authController.js';

const router = Router();

// Registration: reject admin role self-assignment
router.post('/register', (req, res, next) => {
  const { role } = req.body;
  if (role && role === 'admin') {
    return res.status(400).json({ error: 'Admin role cannot be assigned during registration' });
  }
  next();
}, register);

router.post('/login', login);

export { router as authRoutes };
