import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
  role: z.enum(['user', 'admin', 'moderator']).optional().default('user'),
  // Add other required fields as needed
});