import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1),
  text: z.string().trim().min(1, "Proposal text is required").max(4000),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
})
.strict();
