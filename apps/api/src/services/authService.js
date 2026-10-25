import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';

export async function registerUser({ email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  // Generate user id once to avoid timestamp mismatch
  const userId = `user_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      password: hashedPassword,
      role,
    },
  });
  const token = jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
  return { user, token };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: '7d' });
  return { user, token };
}
