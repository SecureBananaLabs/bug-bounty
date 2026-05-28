import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    return next(error);
  }
}
