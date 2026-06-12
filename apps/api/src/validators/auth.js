import { z } from "zod";

export const authPasswordSchema = z.string().trim().min(8);

export const registerSchema = z.object({
  email: z.string().email(),
  password: authPasswordSchema,
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: authPasswordSchema
});
