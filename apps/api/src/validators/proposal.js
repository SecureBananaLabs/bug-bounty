import { z } from "zod";

export const createProposalSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be 200 characters or less"),
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters").max(5000, "Cover letter must be 5000 characters or less"),
  bidAmount: z.number().positive("Bid amount must be a positive number")
});
