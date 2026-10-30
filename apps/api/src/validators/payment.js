import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("amount must be positive").min(0.5, "amount must be at least 0.50").finite(),
  currency: z.string().trim().regex(/^[a-zA-Z]{3}$/, "currency must be a 3-letter ISO code").default("usd")
});
