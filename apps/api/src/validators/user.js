import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const updateUserSchema = createUserSchema.partial();
