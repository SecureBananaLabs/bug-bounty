<content>
import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().length(3),
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
  orderId: z.string(),
  userId: z.string(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
});

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  id: z.string(),
});

export const createPaymentSchemaType = z.infer<typeof createPaymentSchema>;
export const updatePaymentSchemaType = z.infer<typeof updatePaymentSchema>;