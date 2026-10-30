import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["client", "freelancer"]).default("freelancer")
});
