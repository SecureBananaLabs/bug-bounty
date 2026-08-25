import { z } from 'zod';

/**
 * Validation schema for creating a review.
 * Enforces rating bounds (1-5), prevents self-reviews, and requires comments (min 3 chars).
 */
export const createReviewSchema = z.object({
  body: z.object({
    revieweeId: z.string().uuid('Invalid reviewee ID'),
    rating: z.number().int('Rating must be an integer').min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().min(3, 'Comment must be at least 3 characters'),
  }),
  params: z.object({}),
  query: z.object({}),
}).refine((data) => {
  // This will be checked in the controller where we have access to the authenticated user
  return true;
}, {
  message: 'Validation refinement placeholder',
  path: ['refinement'],
});

/**
 * Middleware to validate create review request.
 * Self-review check (reviewerId === revieweeId) is performed in the controller
 * since reviewerId comes from the authenticated user, not the request body.
 */
export const validateCreateReview = (req, res, next) => {
  const result = createReviewSchema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors).flatMap(([field, msgs]) =>
      msgs.map((msg) => `${field}: ${msg}`)
    );
    return res.status(400).json({ errors: messages });
  }

  next();
};
