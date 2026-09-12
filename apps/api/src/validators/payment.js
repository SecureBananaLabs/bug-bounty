import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  amount: z
    .number({ invalid_type_error: "amount must be a number" })
    .finite("amount must be a finite number")
    .positive("amount must be greater than 0"),
  currency: z.string().min(1).optional()
});
