import { ok } from "../utils/response.js";
import { createPaymentIntent, getPaymentById, listPayments } from "../services/paymentService.js";

export async function getPayments(req, res, next) {
  try {
    return ok(res, await listPayments());
  } catch (err) {
    next(err);
  }
}

export async function getPayment(req, res, next) {
  try {
    const payment = await getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    return ok(res, payment);
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req, res, next) {
  try {
    return ok(res, await createPaymentIntent(req.body), 201);
  } catch (err) {
    next(err);
  }
}
