// This file would contain the registration schema that needs to be updated to include fullName
import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CLIENT', 'FREELANCER']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default { registerSchema, loginSchema };