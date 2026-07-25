import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.enum(["usd", "eur", "gbp"]).default("usd"),
});
