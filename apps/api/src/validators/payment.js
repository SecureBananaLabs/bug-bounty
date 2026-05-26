import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().int().positive({
    message: "amount must be a positive integer (smallest currency unit)"
  }),
  currency: z.string().length(3).default("usd")
});
