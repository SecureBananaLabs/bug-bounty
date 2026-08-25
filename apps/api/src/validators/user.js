import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8).optional(),
  role: z.enum(["client", "freelancer"]).default("client")
}).strict();