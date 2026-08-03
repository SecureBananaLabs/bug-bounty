import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["client", "freelancer", "admin"]),
  password: z.string().min(8)
});

export const updateUserSchema = createUserSchema.partial();
