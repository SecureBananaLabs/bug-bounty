import express from 'express';
import { login, register, refresh } from '../services/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await login(email, password);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const newUser = await register(email, password, role);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/refresh', authenticate, async (req, res) => {
  const userId = req.user.sub;
  const userRole = req.user.role;
  try {
    const token = await refresh(userId, userRole);
    res.json({ token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

export default router;
