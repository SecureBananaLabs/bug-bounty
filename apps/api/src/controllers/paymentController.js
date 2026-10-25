import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const payload = createPaymentSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(
      res,
      "Payment payload must include a positive amount",
      400
    );
  }

  const normalizedPayload = {
    amount: payload.data.amount,
    currency: payload.data.currency?.trim().toLowerCase() ?? "usd"
  };

  return ok(res, await createPaymentIntent(normalizedPayload), 201);
}
