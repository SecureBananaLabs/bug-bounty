import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';

/**
 * Register a new user.
 * Generates a unique user ID once and reuses it for both the response and JWT sub claim.
 */
export async function registerUser({ email, password, name, role }) {
  // Generate a single user ID based on timestamp (existing pattern, but now only called once)
  const userId = `user_${Date.now()}`;

  // In a real app, hash password before storing
  const hashedPassword = password; // placeholder for hashing

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      password: hashedPassword,
      name,
      role: role || 'freelancer',
    },
  });

  // Sign token using the same userId as the sub claim
  const token = jwt.sign(
    { sub: userId, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

/**
 * Authenticate user and return JWT.
 */
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  // Verify password (placeholder – implement proper comparison)
  if (password !== user.password) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}
