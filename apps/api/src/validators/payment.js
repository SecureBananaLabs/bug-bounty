import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{3}$/, "Currency must be a three-letter ISO code")
    .optional()
});
