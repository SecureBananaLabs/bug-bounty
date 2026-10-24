import { ZodError } from "zod";
import { createPaymentIntent } from "../services/paymentService.js";
import { ok } from "../utils/response.js";
import { createPaymentSchema } from "../validators/payment.js";

export async function createPayment(req, res) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    const paymentIntent = await createPaymentIntent(payload);

    return ok(res, paymentIntent, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment payload",
        errors: error.flatten(),
      });
    }

    throw error;
  }
}
