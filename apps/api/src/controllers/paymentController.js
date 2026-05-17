import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPayment = asyncHandler(async (req, res) => {
  return ok(res, await createPaymentIntent(req.body), 201);
});
