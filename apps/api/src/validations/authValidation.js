import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['client', 'freelancer', 'admin']).optional(),
  fullName: z.string().min(1, 'Full name is required').trim(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});