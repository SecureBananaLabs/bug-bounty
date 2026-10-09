import { createPaymentIntentSchema } from '../validators/payment';
import { createPaymentIntent } from '../services/paymentService';
import { ok } from '../utils/response';

export const createPayment = async (req, res) => {
  const validatedData = createPaymentIntentSchema.parse(req.body);
  const intent = await createPaymentIntent(validatedData);
  return ok(res, intent, 201);
};
