import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["usd", "eur", "gbp"]).default("usd"),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional()
});
