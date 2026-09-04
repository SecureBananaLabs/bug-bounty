import { z } from "zod";

export const createPaymentSchema = z.object({
  priceId: z.string().min(1)
});
