import { z } from "zod";

export const createPaymentSchema = z.object({jobId: z.string().min(1), amount: z.number().positive(), currency: z.string().default("usd")});
