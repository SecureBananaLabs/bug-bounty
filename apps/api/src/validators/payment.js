import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive").max(1000000, "Payment amount cannot exceed 1,000,000"),
  currency: z.string().trim().length(3, "Currency must be a 3-letter ISO code").default("usd").transform((val) => val.toLowerCase())
});
