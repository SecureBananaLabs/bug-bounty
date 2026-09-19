import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[a-zA-Z]+$/)
    .transform((value) => value.toLowerCase())
    .default("usd")
});
