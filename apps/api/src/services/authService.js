import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '@freelanceflow/db';

function generateId() {
  return Date.now().toString();
}

export async function register(email, password, name) {
  // 只生成一次用户ID
  const userId = generateId();

  // 创建用户时使用该ID
  const user = await prisma.user.create({
    data: { id: userId, email, password, name }
  });

  // 使用相同的 userId 作为 JWT 的 sub 字段
  const token = jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });

  return { user: { id: user.id, email: user.email, name: user.name }, token };
}