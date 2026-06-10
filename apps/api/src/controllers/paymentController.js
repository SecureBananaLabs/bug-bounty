import { ZodError } from "zod";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    return ok(res, await createPaymentIntent(payload), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }

    throw error;
  }
}
