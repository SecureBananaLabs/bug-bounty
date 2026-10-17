import { z } from "zod";

const stripHtml = (val) => val.replace(/<[^>]*>/g, "").trim();

export const createMessageSchema = z.object({
  content: z.string().min(1).max(5000).transform(stripHtml),
  recipientId: z.string().min(1),
  conversationId: z.string().optional(),
});
