import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

export const registerSchema = z.object({
  email: emailField,
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(8)
});

export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(20, "refreshToken is required and must be at least 20 characters")
    .max(4096, "refreshToken exceeds maximum allowed length")
});
