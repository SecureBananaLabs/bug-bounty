import { Request, Response } from 'express';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  // roles field would be omitted or validated to prevent 'admin' assignment
  role: z.string().optional().default('user') // Prevents users from self-assigning admin roles
});

export const register = async (req: Request, res: Respo) => {