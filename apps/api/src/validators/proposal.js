import { z } from "zod";

export const createProposalSchema = z.object({
  summary: z.string().min(10),
  amount: z.number().nonnegative().optional(),
  jobId: z.string().min(1),
  userId: z.string().min(1)
});

export const updateProposalSchema = createProposalSchema.partial();
