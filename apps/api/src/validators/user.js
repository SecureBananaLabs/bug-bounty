import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.enum(["client", "freelancer", "admin"]).default("client"),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url("Invalid URL").optional()
});
