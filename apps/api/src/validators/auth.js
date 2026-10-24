import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters"),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters")
});

export const oauthProviderSchema = z.object({
  provider: z.enum(["google", "github", "gitlab"])
});
