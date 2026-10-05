import { z } from 'zod';

export const createReviewSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters long'),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters long').optional(),
});

export const reviewParamsSchema = z.object({
  id: z.string().min(1, 'Review ID is required'),
});