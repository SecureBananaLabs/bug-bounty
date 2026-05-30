import { z } from "zod";

export const MAX_PASSWORD_LENGTH = 128;

const passwordSchema = z.string().min(8).max(MAX_PASSWORD_LENGTH);

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});
