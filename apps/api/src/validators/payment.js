import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["usd", "eur", "gbp"]).default("usd")
});
