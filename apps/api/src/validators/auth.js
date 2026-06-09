import { z } from "zod";

const publicRoleSchema = z.enum(["client", "freelancer"]).default("client");

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: publicRoleSchema
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
