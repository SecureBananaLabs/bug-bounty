import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(2).max(5).default("usd")
});
