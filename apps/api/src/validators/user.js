import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120).optional(),
})
.strict();
