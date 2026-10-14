import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  // bcrypt silently truncates passwords at 72 bytes. A password longer than
  // 72 chars gives a false sense of security AND costs extra CPU to hash.
  // Cap at 72 to enforce clarity. Min 8 for strength baseline.
  password: z.string().min(8).max(72),
  // fullName is required by the Prisma User model.
  fullName: z.string().min(1).max(100),
  // Block admin self-assignment — role must be assigned by an existing admin.
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

