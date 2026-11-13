import { z } from "zod";

export const createMessageSchema = z.object({
  senderId: z.string().trim().min(1, "senderId is required"),
  receiverId: z.string().trim().min(1, "receiverId is required"),
  content: z.string().trim().min(1, "content cannot be empty").max(5000, "content cannot exceed 5000 characters")
});
