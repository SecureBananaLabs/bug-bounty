import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    const result = await createPaymentIntent(req.body);
    return ok(res, result, 201);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
