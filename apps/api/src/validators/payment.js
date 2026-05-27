import { z } from "zod";

export const createPaymentSchema = z.strictObject({
 amount: z.number().positive("Amount must be positive").min(0.01, "Minimum amount is 0.01"),
 currency: z.string().min(3).max(3).default("usd")
});
