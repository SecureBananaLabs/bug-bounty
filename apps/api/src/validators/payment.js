import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number({ invalid_type_error: "amount must be a positive number" }).positive("amount must be a positive number"),
  currency: z.enum(["usd", "eur"]).default("usd")
});
