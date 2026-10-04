<content>
import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['user', 'admin']).default('user'),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string(),
});

export const createUserSchemaType = z.infer<typeof createUserSchema>;
export const updateUserSchemaType = z.infer<typeof updateUserSchema>;