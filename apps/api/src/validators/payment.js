import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z
    .string()
    .trim()
    .regex(/^[a-z]{3}$/i)
    .transform((currency) => currency.toLowerCase())
    .default("usd")
});
