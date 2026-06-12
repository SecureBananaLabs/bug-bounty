import { z } from "zod";

export const createProposalSchema = z.object({
  coverLetter: z.string().trim().min(10).max(5000),
  bidAmount: z.number().finite().positive(),
  estDuration: z.string().trim().min(1).max(100),
  jobId: z.string().trim().min(1),
  freelancerId: z.string().trim().min(1)
}).strict();
