import { ok, badRequest, serverError } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    if (error.status === 400 || error.status === 402)
      return badRequest(res, error.message, error.details);
    return serverError(res, error.message);
  }
}
