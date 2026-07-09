import { z } from "zod";

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, "recipientId is required"),
  content: z.string().min(1, "Message content is required").max(2000)
});

export const updateMessageSchema = sendMessageSchema.partial();
