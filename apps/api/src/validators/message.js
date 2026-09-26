import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(5000, "Message content must be 5000 characters or less"),
  sender: z.string().min(1, "Sender ID is required"),
  recipient: z.string().min(1, "Recipient ID is required")
});
