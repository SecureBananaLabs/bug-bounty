import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  freelancerId: z.string().min(1, "Freelancer ID is required"),
  estimatedDuration: z.number().min(1, "Estimated duration (hours) is required").max(8760, "Max 1 year"),
  price: z.number().positive("Price must be positive").max(1000000, "Price seems unreasonably high"),
  coverLetter: z.string().min(10, "Cover letter too short").max(5000, "Cover letter too long")
});
