import { z } from "zod";

const supportedCurrencies = ["usd", "eur", "mxn", "gbp", "cad", "aud"];

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z
    .string()
    .trim()
    .toLowerCase()
    .refine((currency) => supportedCurrencies.includes(currency), {
      message: "Unsupported currency"
    })
    .default("usd")
});
