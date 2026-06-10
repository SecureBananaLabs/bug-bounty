import { z } from "zod";

export const MIN_PASSWORD_NON_WHITESPACE_CHARS = 8;

export const passwordSchema = z.string()
  .min(MIN_PASSWORD_NON_WHITESPACE_CHARS)
  .refine(
    (password) => password.replace(/\s/g, "").length >= MIN_PASSWORD_NON_WHITESPACE_CHARS,
    "Password must contain at least 8 non-whitespace characters"
  );

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});
