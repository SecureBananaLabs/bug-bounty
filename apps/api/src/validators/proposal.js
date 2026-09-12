import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  coverLetter: z.string().min(10),
  bidAmount: z.number().positive(),
  estimatedDuration: z
    .string({ required_error: "estimatedDuration is required" })
    .min(1, "estimatedDuration is required")
});
