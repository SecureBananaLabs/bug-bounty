import { z } from "zod";
import { env } from "../config/env.js";

export const createPaymentSchema = z.object({
  amount: z
    .number({
      required_error: "amount is required",
      invalid_type_error: "amount must be a number"
    })
    .finite("amount must be a finite number")
    .nonnegative("amount must be non-negative")
    .max(env.paymentAmountMax, `amount must be <= ${env.paymentAmountMax}`),
  currency: z.string().trim().length(3).optional()
});
