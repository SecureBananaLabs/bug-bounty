import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be greater than 0").max(1000000, "Amount cannot exceed 1,000,000"),
  currency: z.string().trim().toLowerCase().regex(/^[a-z]{3}$/, "Currency must be a 3-letter ISO code").default("usd")
});
