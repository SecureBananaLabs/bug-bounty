import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export const updateUserSchema = createUserSchema.partial();
