import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().email(),
    fullName: z.string().min(2).max(100),
    bio: z.string().max(500).optional(),
    role: z.enum(["client", "freelancer"]).default("client"),
    password: z.string().min(8).optional()
  })
  .strict();
