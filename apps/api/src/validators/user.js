import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().trim().email("Invalid email address").max(255).toLowerCase(),
    fullName: z.string().trim().min(2, "fullName must be at least 2 characters").max(100),
    role: z.enum(["client", "freelancer", "admin"]).optional().default("client"),
    bio: z.string().trim().max(500).optional(),
    password: z.string().optional()
  })
  .strict();
