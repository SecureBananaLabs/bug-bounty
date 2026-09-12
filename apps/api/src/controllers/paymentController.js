import { ok, fail } from "../utils/response.js";
import { createPaymentSchema } from "../validators/payment.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { ZodError } from "zod";

export async function createPayment(req, res, next) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    const result = await createPaymentIntent(payload);
    return ok(res, result, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, error.errors, 400);
    }
    return next(error);
  }
}
