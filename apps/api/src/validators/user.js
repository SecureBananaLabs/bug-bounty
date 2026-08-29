import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
  fullName: z.string().min(1),
  bio: z.string().optional(),
  role: z.enum(["CLIENT", "FREELANCER", "ADMIN"]).default("CLIENT")
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  passwordHash: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  bio: z.string().optional(),
  role: z.enum(["CLIENT", "FREELANCER", "ADMIN"]).optional()
});
