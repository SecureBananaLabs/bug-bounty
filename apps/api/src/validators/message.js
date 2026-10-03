import { z } from "zod";

export const createMessageSchema = z.object({
  content: z.string().trim().min(1),
  recipientId: z.string().trim().min(1),
  jobId: z.string().trim().min(1)
});
