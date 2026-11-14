import { z } from "zod";

const supportedCurrencies = new Set(Intl.supportedValuesOf("currency"));
const currencySchema = z.string()
  .trim()
  .length(3)
  .transform((currency) => currency.toUpperCase())
  .refine((currency) => supportedCurrencies.has(currency), {
    message: "Unsupported ISO currency code"
  })
  .transform((currency) => currency.toLowerCase());

export const createPaymentSchema = z.object({
  amount: z.number().finite().positive(),
  currency: currencySchema.default("usd")
}).strict();
