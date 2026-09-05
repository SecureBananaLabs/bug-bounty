import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000, "Message too long"),
  receiverId: z.string().min(1, "Receiver ID is required")
});
