import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["client", "freelancer"]).optional()
});

export const updateUserSchema = createUserSchema.partial();

