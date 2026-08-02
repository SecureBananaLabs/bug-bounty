import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999, "Amount exceeds maximum"),
  currency: z.enum(["usd", "eur", "gbp", "cad", "aud", "jpy"]).default("usd"),
});
