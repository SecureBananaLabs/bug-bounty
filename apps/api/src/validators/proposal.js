import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  coverLetter: z.string().min(20),
  bidAmount: z.number().nonnegative()
});
