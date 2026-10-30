import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  coverLetter: z.string().min(10, "coverLetter must be at least 10 characters"),
  estimatedDuration: z.string().min(1, "estimatedDuration is required"),
  rate: z.number().positive("rate must be a positive number")
});
