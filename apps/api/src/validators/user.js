import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
}).passthrough();
