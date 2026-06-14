import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z.string().min(1, "name is required"),
    email: z.string().email("email must be a valid email address"),
    role: z.enum(["client", "freelancer"]).default("client"),
  })
  .strict();
