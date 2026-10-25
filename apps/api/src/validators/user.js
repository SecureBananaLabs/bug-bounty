import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer"]).default("client"),
  name: z.string().trim().min(1).max(120).optional(),
  skills: z.array(z.string().trim().min(1)).default([]),
  hourlyRate: z.number().nonnegative().optional()
});
