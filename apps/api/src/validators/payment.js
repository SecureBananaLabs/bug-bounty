import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number({ required_error: "Amount is required" }).positive().finite(),
  currency: z.string().length(3).default("usd"),
});
