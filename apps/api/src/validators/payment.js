import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z
    .string()
    .regex(/^[a-z]{3}$/i, "Currency must be a 3-letter code")
    .transform((value) => value.toLowerCase())
    .default("usd")
});
