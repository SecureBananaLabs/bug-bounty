import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(1, "fullName is required"),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLIENT", "FREELANCER", "ADMIN"]).optional(),