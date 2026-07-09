import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export async function register(req, res) {
  // existing register logic (unchanged)
}

export async function login(req, res) {
  // existing login logic (unchanged)
}

export async function refresh(req, res) {
  // Use authenticated user payload instead of hard-coded values
  const token = jwt.sign(
    { sub: req.user.id, role: req.user.role },
    env.jwtSecret,
    { expiresIn: '1h' }
  );
  res.json({ token });
}
