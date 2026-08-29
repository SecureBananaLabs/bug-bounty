import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  senderId: z.string().min(1),
  receiverId: z.string().min(1),
  jobId: z.string().min(1).optional()
});
