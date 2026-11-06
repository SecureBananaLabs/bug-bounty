import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["client", "freelancer"]).default("client")
});
