import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer").max(1_000_000, "Amount is too large"),
  currency: z.string().trim().toLowerCase().transform((value) => value.toLowerCase()).refine(
    (value) => ["usd", "eur", "gbp", "ils"].includes(value),
    "Unsupported currency"
  ),
})
.strict();
