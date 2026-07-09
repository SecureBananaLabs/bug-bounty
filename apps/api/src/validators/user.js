import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1)
});
