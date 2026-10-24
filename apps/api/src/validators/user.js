import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().trim().email().max(254),
    fullName: z.string().trim().min(1).max(200),
    bio: z.string().trim().max(2_000).optional(),
    role: z.string().trim().min(1).max(64).optional(),
  })
  .strict();
