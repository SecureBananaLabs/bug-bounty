import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(1),
  estimatedDuration: z.string().min(1),
  rate: z.number().positive()
}).strict();
