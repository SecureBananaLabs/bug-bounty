import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["client", "freelancer"]).default("client"),
  fullName: z.string().min(2).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
