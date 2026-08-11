import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().email().optional(),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});
