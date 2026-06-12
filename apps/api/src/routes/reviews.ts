import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../utils/validation';

const reviewSchema = z.object({
  reviewerId: z.string().min(1),
  jobId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

const reviewsRouter = Router();

reviewsRouter.post('/', validate(reviewSchema), async (req, res) => {
  try {
    // Create review logic here
    res.status(201).send({ message: 'Review created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Failed to create review' });
  }
});

export default reviewsRouter;