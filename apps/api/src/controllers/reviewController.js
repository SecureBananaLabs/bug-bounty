import { createReview, getReviewsForUser } from '../services/reviewService.js';
import { validateCreateReview } from '../validators/review.js';

/**
 * POST /api/reviews
 * Create a new review for a user.
 * Validates rating bounds (1-5), prevents self-reviews, requires comment (min 3 chars).
 */
export const postReview = [
  validateCreateReview,
  async (req, res, next) => {
    try {
      const reviewerId = req.user.id;
      const { revieweeId, rating, comment } = req.body;

      // Prevent self-reviews
      if (reviewerId === revieweeId) {
        return res.status(400).json({ errors: ['Users cannot submit reviews for themselves'] });
      }

      const review = await createReview({ reviewerId, revieweeId, rating, comment });
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  },
];

/**
 * GET /api/reviews/:userId
 * Get all reviews for a specific user.
 */
export const getReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const reviews = await getReviewsForUser(userId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};
