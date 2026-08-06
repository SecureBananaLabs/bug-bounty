import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive({ message: "Amount must be positive" }),
  currency: z.string()
    .transform(s => s.toLowerCase())
    .pipe(z.enum(["usd", "eur", "gbp", "cad", "aud"], {
      errorMap: () => ({ message: "Unsupported currency" })
    })),
  jobId: z.string().min(1).optional()
});
