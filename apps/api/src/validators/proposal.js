import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  userId: z.string().min(1, "userId is required"),
  bidAmount: z.number().positive("bid amount must be positive"),
  coverLetter: z.string().min(1, "cover letter is required").max(2000),
});
