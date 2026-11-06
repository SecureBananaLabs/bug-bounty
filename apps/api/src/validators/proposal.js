import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().trim().min(1, "jobId is required"),
  coverLetter: z.string().trim().min(1, "coverLetter is required"),
  bidAmount: z.number().positive("bidAmount must be strictly positive").finite()
});
