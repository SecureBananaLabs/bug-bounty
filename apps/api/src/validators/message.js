import { z } from "zod";

export const createMessageSchema = z.object({
  recipientId: z.string().trim().min(1, "Recipient ID is required").max(64, "Recipient ID too long"),
  content: z.string().trim().min(1, "Message content cannot be empty").max(2000, "Message content cannot exceed 2000 characters")
});
