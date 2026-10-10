import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  passwordHash: z.string().min(1).optional(),
  bio: z.string().optional(),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
}).strict();
