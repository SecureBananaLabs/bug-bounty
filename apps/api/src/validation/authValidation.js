import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'freelancer', 'admin']).optional(),
  fullName: z.string().min(1, 'Full name is required'),
});
