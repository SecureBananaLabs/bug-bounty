import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
