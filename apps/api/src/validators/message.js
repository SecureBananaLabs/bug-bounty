import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().min(1, "senderId is required"),
  receiverId: z.string().min(1, "receiverId is required"),
  content: z.string().min(1, "content is required").max(5000),
});
