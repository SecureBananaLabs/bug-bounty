import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().min(1, "Sender ID is required"),
  recipientId: z.string().min(1, "Recipient ID is required"),
  content: z.string().min(1, "Message content is required")
});

export const updateMessageSchema = createMessageSchema.partial();
