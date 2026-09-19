import { ok } from '../utils/response.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    name: payload.name,
    email: payload.email,
    role: payload.role || 'public'
  };
  
  // 确保只保留合法字段
  const allowedFields = ['name', 'email', 'role'];
  const filteredPayload = Object.keys(user).filter(k => allowedFields.includes(k)).reduce((acc, k) => {
    acc[k] = user[k];
    return acc;
  }, {});
  
  try {
    return await prisma.user.create({ data: filteredPayload });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listUsers() {
  try {
    return await prisma.user.findMany();
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}