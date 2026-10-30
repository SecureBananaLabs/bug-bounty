import { z } from "zod";
import { paymentPriceCatalog } from "../services/paymentService.js";

export const createPaymentSchema = z.object({
  priceId: z.string().min(1).refine((priceId) => Object.hasOwn(paymentPriceCatalog, priceId))
});
