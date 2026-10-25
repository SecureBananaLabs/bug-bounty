import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  currency: z.string().optional()
}).passthrough();
