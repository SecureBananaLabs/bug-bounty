import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(254, "email cannot exceed 254 characters"),
  password: z.string().min(8, "password must be at least 8 characters").max(128, "password cannot exceed 128 characters"),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(254, "email cannot exceed 254 characters"),
  password: z.string().min(8, "password must be at least 8 characters").max(128, "password cannot exceed 128 characters")
});
