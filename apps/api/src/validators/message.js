import { z } from "zod";

export const createMessageSchema = z
  .object({
    senderId: z.string().trim().min(1, "senderId is required").max(128),
    receiverId: z.string().trim().min(1, "receiverId is required").max(128),
    content: z.string().trim().min(1, "content cannot be empty").max(5000, "content exceeds maximum length"),
    conversationId: z.string().trim().min(1).max(128).optional()
  })
  .strict();
