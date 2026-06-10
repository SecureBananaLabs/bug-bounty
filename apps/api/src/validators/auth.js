import { z } from "zod";

const authPasswordSchema = z
  .string()
  .min(8)
  .refine((value) => value.trim().length > 0, "Password cannot be blank");

export const registerSchema = z.object({
  email: z.string().email(),
  password: authPasswordSchema,
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: authPasswordSchema
});
