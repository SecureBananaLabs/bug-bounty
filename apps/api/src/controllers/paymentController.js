import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return fail(res, "Unauthorized", 401);
    }

    const result = await createPaymentIntent(req.body, userId);
    return ok(res, result, 201);
  } catch (err) {
    if (err.message.startsWith("Invalid or missing")) {
      return fail(res, err.message, 400);
    }
    return fail(res, err.message, 500);
  }
}
