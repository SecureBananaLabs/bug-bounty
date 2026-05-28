import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.string().length(3).toUpperCase().default("USD"),
  jobId: z.string().optional(),
  proposalId: z.string().optional()
});
