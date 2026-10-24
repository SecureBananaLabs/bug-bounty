import { z } from "zod";

export const createProposalSchema = z.object({
  coverLetter: z.string().trim().min(1),
  bidAmount: z.number().positive(),
  estDuration: z.string().trim().min(1),
  jobId: z.string().min(1),
  freelancerId: z.string().min(1)
});
