import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("amount must be greater than zero"),
  currency: z.string().min(3).max(3).default("usd"),
  jobId: z.string().optional()
});
