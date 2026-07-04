import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().length(3).optional()
}).passthrough();
