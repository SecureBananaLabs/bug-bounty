import { z } from "zod";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const schema = z.object({ amount: z.number().positive(), currency: z.string().optional() }).strict();

export async function createPayment(req, res) {
  let payload;
  try {
    payload = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }
  return ok(res, await createPaymentIntent(payload), 201);
}
