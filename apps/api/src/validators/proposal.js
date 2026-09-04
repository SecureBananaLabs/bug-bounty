import { z } from "zod";

export const proposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(20).max(3000),
  bidAmount: z.number().positive()
});
