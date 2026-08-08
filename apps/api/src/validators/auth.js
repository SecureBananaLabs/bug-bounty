import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  // `admin` is reserved for internally-provisioned accounts and must not be
  // self-assignable by unauthenticated registrations (bounty #11456).
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
