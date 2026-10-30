import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive({ message: "Amount must be a positive number" }).finite({ message: "Amount must be a finite number" }),
  currency: z.string().min(1).optional().default("usd")
});
