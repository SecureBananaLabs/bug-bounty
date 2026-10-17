import { z } from "zod";

export const createPaymentSchema = z.object({
  jobId: z.string().min(1),
  currency: z.string().min(1).default("usd")
});
