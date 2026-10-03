<content>
import { createPaymentIntentSchema } from '../validators/payment.js';
import { createPaymentIntent } from '../services/paymentService.js';

export const createPayment = async (req, res) => {
  createPaymentIntentSchema.parse(req.body);
  ok(res, await createPaymentIntent(req.body), 201);
};
</content>