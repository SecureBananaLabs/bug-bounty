import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).toLowerCase().default("usd"),
  jobId: z.string().min(1)
});
