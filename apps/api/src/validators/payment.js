import { z } from "zod";

export const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(8).default("usd")
});
