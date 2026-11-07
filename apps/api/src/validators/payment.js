import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999, "Amount too large"),
  currency: z.enum(["usd", "eur", "gbp", "cny"]).default("usd"),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
});
