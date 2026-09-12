import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

function formatPaymentValidationError(error) {
  return error.issues[0]?.message ?? "Invalid payment request";
}

export async function createPayment(req, res, next) {
  const parsed = createPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, formatPaymentValidationError(parsed.error), 400);
  }

  try {
    return ok(res, await createPaymentIntent(parsed.data), 201);
  } catch (error) {
    if (error.expose && Number.isInteger(error.statusCode)) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}
