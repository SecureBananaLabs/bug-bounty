import { z } from "zod";

export const publicUserRoleSchema = z.enum(["client", "freelancer"]);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: publicUserRoleSchema.default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
