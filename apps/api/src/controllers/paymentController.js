<content>
import { ok, badRequest } from '../utils/response.js';
import { createPaymentSchema } from '../validators/payment.js';
import { createPayment } from '../services/paymentService.js';

export async function createPayment(req, res) {
  try {
    const payload = createPaymentSchema.parse(req.body);
    return ok(res, await createPayment(payload), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(res, error.message);
    }
    throw error;
  }
}

export async function getPayment(req, res) {
  // Implementation
}

export async function updatePayment(req, res) {
  // Implementation
}

export async function deletePayment(req, res) {
  // Implementation
}