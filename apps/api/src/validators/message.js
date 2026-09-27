import { z } from "zod";

export const createMessageSchema = z.object({
  to: z.string().min(1),
  text: z.string().min(1)
});
