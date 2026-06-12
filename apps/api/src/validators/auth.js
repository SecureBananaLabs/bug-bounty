import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).refine((s) => s.trim().length > 0, "Password must not be whitespace only"),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).refine((s) => s.trim().length > 0, "Password must not be whitespace only")
});
