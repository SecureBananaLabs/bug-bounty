<content>
import { z } from 'zod';

export const createReviewSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500),
  isVerified: z.boolean().default(false),
});

export const updateReviewSchema = createReviewSchema.partial().extend({
  id: z.string(),
});

export const createReviewSchemaType = z.infer<typeof createReviewSchema>;
export const updateReviewSchemaType = z.infer<typeof updateReviewSchema>;