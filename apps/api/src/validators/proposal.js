import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1),
}).passthrough();
