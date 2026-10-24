import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(254, "email cannot exceed 254 characters"),
  username: z.string().trim().min(3, "username must be at least 3 characters").max(30, "username cannot exceed 30 characters").regex(/^[a-zA-Z0-9_]+$/, "username must only contain letters, numbers, and underscores"),
  role: z.enum(["client", "freelancer"]).default("freelancer"),
  bio: z.string().trim().max(500, "bio cannot exceed 500 characters").optional()
});
