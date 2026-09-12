import { z } from "zod";

const selfServiceRoleSchema = z.enum(["client", "freelancer"]);

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: selfServiceRoleSchema.default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
