import { z } from "zod";

const supportedCurrencies = ["usd", "eur", "gbp"];

export const createPaymentSchema = z
  .object({
    amount: z.number().positive(),
    currency: z.enum(supportedCurrencies).default("usd")
  })
  .strict();
