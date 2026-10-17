import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { fail } from "../utils/response.js";

export async function createPayment(req, res) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (error) {
    if (error instanceof RangeError) {
      return fail(res, error.message, 400);
    }

    throw error;
  }
}
