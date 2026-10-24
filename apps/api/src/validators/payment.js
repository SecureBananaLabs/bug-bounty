import { z } from "zod";

export const createPaymentSchema = z
  .object({
    amount: z
      .number({
        required_error: "amount is required",
        invalid_type_error: "amount must be a number",
      })
      .finite("amount must be a finite number")
      .positive("amount must be greater than 0"),

    currency: z.enum(["usd", "eur", "gbp", "usdc"]).default("usd"),

    jobId: z.string().min(1).max(128).optional(),

    recipientId: z.string().min(1).max(128).optional(),

    description: z.string().max(500).optional(),

    metadata: z.record(z.string()).optional(),
  })
  .strict();
