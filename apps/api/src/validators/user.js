import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(8),
  fullName: z.string().trim().min(1),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});
