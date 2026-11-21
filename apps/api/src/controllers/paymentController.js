import { z } from "zod";
import { ok } from "../utils/response.js";
import { createPaymentIntent } from "../services/paymentService.js";

const schema = z.object({}).passthrough();

export async function createPayment(req, res) {
  const payload = schema.parse(req.body);
  return ok(res, await createPaymentIntent(payload), 201);
}
