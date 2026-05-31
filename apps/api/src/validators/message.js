import { z } from "zod";

export const sendMessageSchema = z.object({
  senderId: z.string().min(1, "senderId is required"),
  receiverId: z.string().min(1, "receiverId is required"),
  body: z.string().min(1, "body is required").max(5000, "body must not exceed 5000 characters")
});
