import { ok, fail } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

// Whitelist of allowed payment fields
const ALLOWED_FIELDS = [
  "amount",
  "currency",
  "description",
  "metadata",
  "paymentMethodId",
  "customerId",
  "receiptEmail",
  "statementDescriptor",
];

export async function createPayment(req, res) {
  // Require authenticated user
  if (!req.user || !req.user.id) {
    return fail(res, "Authentication required", 401);
  }

  // Whitelist allowed fields from request body
  const allowedData = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      allowedData[field] = req.body[field];
    }
  }

  // Attach user context to payment (always server-controlled)
  const paymentData = {
    ...allowedData,
    userId: req.user.id,
  };

  return ok(res, await createPaymentIntent(paymentData), 201);
}
