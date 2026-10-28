import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).optional()
}).refine(
  (data) => {
    // Prevent admin role self-assignment
    if (data.role === UserRole.ADMIN) {
      return false;
    }
    return true;
  },
  {
    message: "Admin role cannot be self-assigned",
    path: ["role"]
  }
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});