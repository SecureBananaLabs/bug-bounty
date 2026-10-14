import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  jobId: z.string().min(1)
}).strict();
