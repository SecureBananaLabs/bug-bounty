import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().min(1, "senderId is required"),
  recipientId: z.string().min(1, "recipientId is required"),
  content: z.string().trim().min(1, "content cannot be blank").max(5000, "content too long")
});
