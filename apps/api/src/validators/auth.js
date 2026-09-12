import { z } from "zod";

export const passwordComplexitySchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordComplexitySchema,
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

/**
 * Helper to validate password complexity directly.
 *
 * @param {string} password
 * @returns {{ success: boolean, errors?: string[] }}
 */
export function validatePasswordComplexity(password) {
  const result = passwordComplexitySchema.safeParse(password);
  if (result.success) {
    return { success: true };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => e.message)
  };
}
