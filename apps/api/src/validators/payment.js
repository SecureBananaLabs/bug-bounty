import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.string().min(1).default("usd")
});
