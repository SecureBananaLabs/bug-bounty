import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(20),
  bidAmount: z.number().nonnegative(),
  estimatedDays: z.number().int().positive().optional(),
  attachments: z.array(z.string().url()).optional().default([])
});

export const updateProposalSchema = createProposalSchema.partial();
