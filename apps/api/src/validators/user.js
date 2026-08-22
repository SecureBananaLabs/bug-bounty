import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().trim().min(1).max(120),
    role: z.enum(["client", "freelancer", "admin"]).default("client")
  })
  .strict();
