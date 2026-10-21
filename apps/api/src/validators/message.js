import { z } from "zod";

export const sendMessageSchema = z.object({
  to: z.string().trim().min(1, "Recipient 'to' is required"),
  content: z.string().trim().min(1, "Message 'content' cannot be empty").max(2000, "Message 'content' cannot exceed 2000 characters")
});
