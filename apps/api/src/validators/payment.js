import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: "amount is required" })
    .int("amount must be an integer")
    .positive("amount must be positive"),
  currency: z.string().min(2).max(3).optional().default("usd"),
  metadata: z.record(z.string()).optional(),
});
