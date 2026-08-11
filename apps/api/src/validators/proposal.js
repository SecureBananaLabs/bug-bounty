import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(10).max(5000),
  bidAmount: z.number().nonnegative(),
  estimatedDays: z.number().int().positive(),
});

export const updateProposalSchema = z.object({
  coverLetter: z.string().min(10).max(5000).optional(),
  bidAmount: z.number().nonnegative().optional(),
  estimatedDays: z.number().int().positive().optional(),
});
