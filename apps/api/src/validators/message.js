import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().min(1, "Content is required"),
  recipientId: z.string().min(1, "Recipient ID is required"),
  jobId: z.string().min(1, "Job ID is required")
});
