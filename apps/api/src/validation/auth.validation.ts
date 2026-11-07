import { z } from 'zod';

// Prevent admin role assignment during registration
export const sanitizeRegistrationInput = (req: any) => {
  if (req.body && req.body.role) {
    // Prevent admin role self-assignment
    if (req.body.role === 'admin') {
      req.body.role = 'user';
    }
  }
  return req;
};

export const roleSchema = z.enum(['user', 'client', 'freelancer']);
export type Role = z.infer<typeof roleSchema>;