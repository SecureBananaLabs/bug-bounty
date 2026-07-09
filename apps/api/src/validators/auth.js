import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "fullName is required").max(255),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
