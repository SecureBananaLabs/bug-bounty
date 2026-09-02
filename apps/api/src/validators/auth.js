import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // Role is server-assigned; client-provided role is ignored to prevent privilege escalation
  role: z.enum(["client", "freelancer"]).optional().default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
