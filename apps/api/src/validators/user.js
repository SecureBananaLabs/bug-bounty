import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  role: z.enum(["client", "freelancer"]).default("client")
});
