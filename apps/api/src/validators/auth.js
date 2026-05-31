import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer"]).default("client")
}).transform(({ role, ...rest }) => ({ ...rest, role }));

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
