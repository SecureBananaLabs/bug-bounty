import { z } from "zod";

export const createProposalSchema = z.object({
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters").max(5000, "Cover letter cannot exceed 5000 characters"),
  bidAmount: z.number().positive("Bid amount must be a positive number"),
  estDuration: z.string().min(1, "Estimated duration is required").max(100),
  jobId: z.string().min(1, "Job ID is required"),
  freelancerId: z.string().min(1, "Freelancer ID is required").optional()
});

export const updateProposalSchema = createProposalSchema.partial();
