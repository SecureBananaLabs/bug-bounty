import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  role: z.enum(["client", "freelancer"]).default("client"),
  bio: z.string().max(2000).optional(),
  skills: z.array(z.string().min(1)).optional()
});

export const updateUserSchema = createUserSchema.partial();
