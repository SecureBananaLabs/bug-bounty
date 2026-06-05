import { z } from 'zod';
import { userRole } from '../db/schema';

export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(1, {
    message: 'Password is required',
  }),
});

export const registerSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters long',
  }),
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters long',
  }),
  role: z.enum(userRole.enumValues).refine((role) => role !== 'admin', {
    message: 'Cannot assign admin role to yourself.',
  }),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters long',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
