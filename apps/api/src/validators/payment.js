import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  amount: z.number().finite().positive()
});
