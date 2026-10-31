import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["client", "freelancer"]).default("client")
});
