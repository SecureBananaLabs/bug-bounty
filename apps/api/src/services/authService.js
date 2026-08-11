import prisma from '@freelanceflow/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export async function registerUser(data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}
