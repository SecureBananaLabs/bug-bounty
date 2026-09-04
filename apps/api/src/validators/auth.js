import { z } from "zod";

const passwordSchema = z
  .string()
  .refine((value) => value.replace(/\s/g, "").length >= 8, {
    message: "password must contain at least 8 non-whitespace characters"
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
