import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive().max(100000),
  currency: z.enum(["usd", "eur", "gbp", "cny"]).default("usd"),
  jobId: z.string().min(1),
  payerId: z.string().min(1),
  payeeId: z.string().min(1)
});
