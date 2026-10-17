import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  isDisabled: z.boolean().optional()
});
