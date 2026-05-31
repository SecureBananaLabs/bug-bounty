import { z } from "zod";

export const sendMessageSchema = z
  .object({
    senderId: z.string().min(1, "senderId is required"),
    recipientId: z.string().min(1, "recipientId is required"),
    content: z.string().min(1, "content is required"),
  })
  .strict();
