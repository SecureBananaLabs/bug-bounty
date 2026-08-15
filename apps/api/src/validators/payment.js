import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(2).max(10).default("usd"),
  jobId: z.string().min(1)
});
