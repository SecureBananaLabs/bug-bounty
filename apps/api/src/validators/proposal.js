import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  coverLetter: z.string().min(20, "Cover letter must be at least 20 characters"),
  proposedRate: z.number().positive("Rate must be positive"),
  estimatedDuration: z.number().int().positive("Duration must be a positive number"),
  skills: z.array(z.string().min(1)).default([]),
});

export const updateProposalSchema = createProposalSchema.partial();
