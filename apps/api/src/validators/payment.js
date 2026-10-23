import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be a positive number").finite("Amount must be a finite number"),
  currency: z
    .string()
    .min(3, "Currency must be at least 3 characters")
    .max(10, "Currency cannot exceed 10 characters")
    .default("usd")
    .transform((val) => val.toLowerCase()),
  jobId: z.string().optional(),
  recipientId: z.string().optional()
});

export const updatePaymentSchema = createPaymentSchema.partial();
