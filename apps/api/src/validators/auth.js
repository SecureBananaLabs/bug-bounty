import { z } from "zod";

const passwordSchema = z.string().min(8).refine(
  (val) => val.trim().length > 0,
  { message: "password must not be whitespace-only" }
);

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  fullName: z.string().min(1, "fullName is required"),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: passwordSchema
});
