import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number({ invalid_type_error: "amount must be a number" }).positive("amount must be greater than 0"),
  currency: z.string().trim().length(3, "currency must be a 3-letter code").optional()
});
