import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).optional(),
  bio: z.string().max(1000).optional()
});
