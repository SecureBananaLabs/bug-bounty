import { z } from "zod";

export const createProposalSchema = z.object({
  coverLetter: z.string().min(1),
  bidAmount: z.number({ invalid_type_error: "bidAmount must be a positive number" }).positive("bidAmount must be a positive number"),
  estDuration: z.string().min(1),
  jobId: z.string().min(1),
  freelancerId: z.string().min(1)
});
