import { z } from "zod";

export const MIN_COVER_LETTER_LENGTH = 20;

export const proposalIdSchema = z.string().min(1);

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(MIN_COVER_LETTER_LENGTH),
  bid: z.number().positive()
});

export const updateProposalSchema = createProposalSchema.partial();
