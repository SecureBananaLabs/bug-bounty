import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";
import { ZodError } from "zod";

export async function createPayment(req, res, next) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(payload), 201);
  } catch (err) {
    if (err instanceof ZodError || err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: err.issues
      });
    }
    if (next) return next(err);
    throw err;
  }
}
