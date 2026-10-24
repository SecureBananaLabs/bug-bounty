import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().int().positive("amount must be a positive integer (cents)"),
  currency: z.string().length(3).default("usd"),
});
