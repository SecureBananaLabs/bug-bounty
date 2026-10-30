import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["client", "freelancer"], {
    errorMap: (issue) => ({
      message: issue.code === "invalid_enum_value" && issue.received === "admin"
        ? "Administrative role cannot be self-assigned during registration"
        : "Role must be either client or freelancer"
    })
  }).default("client")
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
