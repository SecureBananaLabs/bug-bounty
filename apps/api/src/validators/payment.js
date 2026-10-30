import { z } from "zod";

export const createPaymentSchema = z
  .object({
    amount: z.number().positive("Amount must be greater than 0").finite(),
    currency: z.enum(["usd", "eur", "gbp", "usdc"]).default("usd"),
    jobId: z.string().trim().min(1, "jobId cannot be empty").max(128).optional(),
    recipientId: z.string().trim().min(1, "recipientId cannot be empty").max(128).optional(),
    description: z.string().trim().max(500).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  })
  .strict();
