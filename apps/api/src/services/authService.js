import { prisma } from '@freelanceflow/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function registerUser({ email, password, role, fullName }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      role: role || 'freelancer',
    },
  });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    token,
  };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    token,
  };
}

export async function refreshToken(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

export async function logoutUser(userId) {
  // token invalidation logic can be added here (e.g., blacklist)
  return { success: true };
}
