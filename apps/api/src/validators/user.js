import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  role: z.enum(["client", "freelancer"]).default("client").optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional()
});
