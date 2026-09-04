import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const updateUserSchema = createUserSchema.partial();
