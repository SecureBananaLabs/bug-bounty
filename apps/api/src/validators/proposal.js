import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  freelancerId: z.string().min(1, "freelancerId is required"),
  coverLetter: z.string().trim().min(1, "coverLetter is required"),
  bidAmount: z.number().positive("bidAmount must be greater than 0")
});
