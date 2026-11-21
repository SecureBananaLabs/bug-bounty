import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getUserById, createUser, getUserByEmail } from '../models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export const login = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return generateToken(user.id, user.role);
};

export const register = async (email, password, role) => {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser(email, hashedPassword, role);
};

export const refresh = async (userId, userRole) => {
  if (!userId || !userRole) {
    throw new Error('Invalid token payload');
  }
  return generateToken(userId, userRole);
};

const generateToken = (sub, role) => {
  return jwt.sign({ sub, role }, JWT_SECRET, {
    expiresIn: '1h',
  });
};
