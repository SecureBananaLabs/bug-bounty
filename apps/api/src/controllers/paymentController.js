import { ok } from "../utils/response.js";
const { createPaymentSchema } = require('../validators/payment');
import { createPaymentIntent } from "../services/paymentService.js";

export async function createPayment(req, res) {
    const parsed = createPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid payment payload',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent(parsed.data);
}
  } catch (err) {
    return next(err);
  }
};
