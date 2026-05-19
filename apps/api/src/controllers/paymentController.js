import { badRequest, ok, serverError } from "../utils/response.js";
import { createPaymentIntent, retrievePaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    if (error.status === 400 || error.status === 402) {
      return badRequest(res, error.message, error.details);
    }
    return serverError(res, error.message);
  }
}

export async function getPayment(req, res) {
  try {
    const { id } = req.params;
    const result = await retrievePaymentIntent(id);
    return ok(res, result);
  } catch (error) {
    if (error.status === 404) {
      return badRequest(res, "Payment not found");
    }
    return serverError(res, error.message);
  }
}
