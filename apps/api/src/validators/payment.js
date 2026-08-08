import { z } from "zod";

export const createPaymentSchema = z
  .object({
    amount: z.number().positive("amount must be a positive number"),
    currency: z.string().length(3, "currency must be a 3-letter code").default("usd"),
  })
  .strict();
