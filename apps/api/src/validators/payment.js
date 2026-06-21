import { z } from "zod";

const SUPPORTED_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud"];

export const createPaymentSchema = z.object({
  amount: z.number().positive({ message: "amount must be a positive number" }),
  currency: z.string()
    .transform(c => c.toLowerCase())
    .refine(c => SUPPORTED_CURRENCIES.includes(c), {
      message: `currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`
    })
    .default("usd"),
  jobId: z.string().min(1).optional()
});
