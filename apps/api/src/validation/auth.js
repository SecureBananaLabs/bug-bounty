import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["FREELANCER", "CLIENT", "ADMIN"]).optional(),
});

  email: z.string().email(),
  password: z.string().min(6),
});