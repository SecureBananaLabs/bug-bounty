import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // SECURITY: do not allow self-registration as admin. Admins must be provisioned
  // through an out-of-band trusted channel, never from public signup input.
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
