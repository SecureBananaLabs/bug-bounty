import { z } from "zod";

const emailSchema = z.string().trim().email().transform((email) => email.toLowerCase());

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8)
});
