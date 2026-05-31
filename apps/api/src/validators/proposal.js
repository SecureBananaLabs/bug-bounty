import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  coverLetter: z.string().min(10, "coverLetter must be at least 10 characters"),
  bidAmount: z.number().positive("bidAmount must be a positive number"),
  estimatedDuration: z.string().optional()
});
