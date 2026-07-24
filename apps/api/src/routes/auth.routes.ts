import { Router } from 'express';
import { register, login, refreshToken, oauthCallback } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { registerSchema, loginSchema } from '../validation/auth.schema';

const router = Router();
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.get('/oauth/:provider/callback', oauthCallback);

// Admin role assignment endpoint - protected to prevent self-assignment
router.post('/assign-role', authenticate, (req, res, next) => {
  const { role } = req.body;
  // Prevent users from assigning themselves admin role
  if (role === 'admin' || role === 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Cannot self-assign admin role' });
  }
  next();
});

export default router;
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Prevent self-assignment of admin role during registration
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === 'admin') {
      return res.status(403).json({ message: 'Forbidden: Cannot register with admin role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'user',
      },
    });

import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const FORBIDDEN_SELF_ADMIN = 'Forbidden: Cannot self-assign admin role';

export async function registerUser(data: RegisterInput) {
  // Strip admin role from registration to prevent self-assignment
  if (data.role?.toLowerCase() === 'admin') {
    throw new Error(FORBIDDEN_SELF_ADMIN);
  }
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: 'user',
    },
  });
}
import { z } from 'zod';

const FORBIDDEN_ROLES = ['admin", "ADMIN", "Admin"];

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["user", "freelancer", "client"]).optional(),
  }),
});

// Additional validation to catch admin role attempts
export const validateRole = (role: string | undefined): boolean => {
  if (!role) return true;
  return !FORBIDDEN_ROLES.includes(role);
};

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { FORBIDDEN_SELF_ADMIN } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const preventAdminSelfAssignment = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body;
  
  if (role && role.toLowerCase() === 'admin') {
    return res.status(403).json({ message: FORBIDDEN_SELF_ADMIN });
  }
  
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin") {
    return res.status(403).json({ message: 'Admin access required' });