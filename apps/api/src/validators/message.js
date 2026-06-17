import { z } from "zod";

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "recipientId is required"),
  content: z.string().min(1, "content is required").max(5000, "content too long")
});
