import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["usd"]).default("usd")
});
