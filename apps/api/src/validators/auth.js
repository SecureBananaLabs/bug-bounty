import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
  // role is intentionally excluded from registration input
  // to prevent privilege escalation (issue #1823)
}).strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
