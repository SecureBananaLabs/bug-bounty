import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  jobId: z.string().trim().min(1)
});
