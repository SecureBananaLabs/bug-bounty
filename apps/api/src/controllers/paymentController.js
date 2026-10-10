import { fail, ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  const parsed = createPaymentSchema.safeParse(req.body);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return fail(res, `${issue.path.join(".")} must be valid`, 400);
  }

  return ok(res, await createPaymentIntent(parsed.data), 201);
}
