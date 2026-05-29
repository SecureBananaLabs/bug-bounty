import { z } from "zod";

export const sendMessageSchema = z.object({
  to: z.string().min(1),
  from: z.string().min(1),
  content: z.string().min(1).max(5000),
});
