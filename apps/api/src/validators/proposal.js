import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  freelancerId: z.string().min(1, "freelancerId is required"),
  coverLetter: z.string().min(10, "coverLetter must be at least 10 characters"),
  bidAmount: z.number().positive("bidAmount must be positive"),
  estDuration: z.string().min(1, "estDuration is required")
});
