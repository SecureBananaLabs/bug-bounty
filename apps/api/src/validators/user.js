import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["client", "freelancer", "admin"]).default("client"),
}).passthrough();
