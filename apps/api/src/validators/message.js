import { z } from "zod";

export const createMessageSchema = z.object({
  text: z.string().min(1, "Message text is required"),
  recipientId: z.string().min(1).optional()
});
