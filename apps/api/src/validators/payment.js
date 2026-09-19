import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(100000, "Amount exceeds limit"),
  currency: z.string().length(3, "Currency must be ISO 4217 (3 chars)").default("USD"),
  jobId: z.string().min(1, "Job ID is required"),
  proposalId: z.string().min(1, "Proposal ID is required")
});
