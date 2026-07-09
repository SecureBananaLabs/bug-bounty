import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const refreshToken = async ({ userId, role }) => {
  const payload = { sub: userId, role };
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: '15m' });
  return { accessToken };
};
