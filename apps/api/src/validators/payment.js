import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().finite().positive(),
  currency: z.enum(["usd"]).default("usd")
});
