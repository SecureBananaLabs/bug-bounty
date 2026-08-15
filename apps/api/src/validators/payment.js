import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z
    .number({
      required_error: "Payment amount is required",
      invalid_type_error: "Payment amount must be a number"
    })
    .positive({ message: "Payment amount must be greater than 0" }),
  currency: z
    .string({ invalid_type_error: "Payment currency must be a string" })
    .trim()
    .min(1, { message: "Payment currency is required" })
    .default("usd")
});
