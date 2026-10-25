import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[a-z]{3}$/i)
    .transform((currency) => currency.toLowerCase())
    .default("usd"),
});
