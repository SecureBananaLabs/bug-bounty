import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error.expose && Number.isInteger(error.statusCode)) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}
