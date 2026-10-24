import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
  role: z.enum(["client", "freelancer"], {
    errorMap: () => ({ message: "Direct admin registration is prohibited. Allowed roles: client, freelancer" })
  }).default("client")
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long")
});
