import { z } from "zod";
export const createPaymentSchema = z.object({
  amount: z.number().positive("amount must be a positive number"),
  currency: z.string().length(3).default("usd"),
  jobId: z.string().min(1).optional()
});
