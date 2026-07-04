import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1),
  provider: z.string().min(1)
});
