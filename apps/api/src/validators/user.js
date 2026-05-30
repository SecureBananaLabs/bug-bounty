import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["client", "freelancer"]).default("client"),
  bio: z.string().max(500).optional()
});
