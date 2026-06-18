import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const updateUserSchema = createUserSchema.partial();
