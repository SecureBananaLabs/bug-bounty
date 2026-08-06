import { z } from "zod";

const passwordSchema = z.string().min(8).refine((value) => value.trim().length > 0, {
  message: "Password cannot be blank"
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});
