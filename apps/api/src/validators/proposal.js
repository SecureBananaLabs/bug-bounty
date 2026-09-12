import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1),
  freelancerId: z.string().trim().min(1),
  coverLetter: z.string().trim().min(1),
  bidAmount: z.number().positive()
}).strict();
