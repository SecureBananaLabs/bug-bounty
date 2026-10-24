import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("usd"),
  jobId: z.string().min(1)
});
