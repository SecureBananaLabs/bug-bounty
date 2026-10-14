import { z } from "zod";

export const AUTH_EMAIL_MAX_LENGTH = 254;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

export const registerSchema = z.object({
  email: z.string().email().max(AUTH_EMAIL_MAX_LENGTH),
  password: z.string().min(8).max(AUTH_PASSWORD_MAX_LENGTH),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email().max(AUTH_EMAIL_MAX_LENGTH),
  password: z.string().min(8).max(AUTH_PASSWORD_MAX_LENGTH)
});
