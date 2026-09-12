import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "currency must be a three-letter code")
    .transform((value) => value.toLowerCase())
    .default("usd")
});
