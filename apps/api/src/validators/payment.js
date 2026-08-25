import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional()
});
