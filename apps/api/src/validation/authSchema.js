import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
});