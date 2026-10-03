import { z } from "zod";

export const createProposalSchema = z.object({
  coverLetter: z.string().min(10),
  bidAmount: z.number().positive(),
  estDuration: z.string().min(1),
  jobId: z.string().min(1),
  freelancerId: z.string().min(1)
});

export const updateProposalSchema = createProposalSchema.partial();
