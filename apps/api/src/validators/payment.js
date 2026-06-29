import { z } from "zod";

export const supportedPaymentCurrencies = ["usd", "eur", "gbp"];

export const paymentIntentSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value ?? "usd"),
    z.enum(supportedPaymentCurrencies)
  )
});
