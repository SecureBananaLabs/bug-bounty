import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["client", "freelancer", "admin"]).default("client"),
  skills: z.array(z.string().min(1)).default([])
});
