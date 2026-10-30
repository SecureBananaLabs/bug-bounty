import { z } from "zod";
export const createProposalSchema = z.object({ jobId: z.string().min(1), bidAmount: z.number().positive(), estimatedDuration: z.string().min(1), coverLetter: z.string().min(1).optional() });
