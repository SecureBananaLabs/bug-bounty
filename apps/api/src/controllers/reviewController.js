<content>
import { ok, badRequest } from '../utils/response.js';
import { createReviewSchema } from '../validators/review.js';
import { createReview } from '../services/reviewService.js';

export async function postReview(req, res) {
  try {
    const payload = createReviewSchema.parse(req.body);
    return ok(res, await createReview(payload), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(res, error.message);
    }
    throw error;
  }
}

export async function getReview(req, res) {
  // Implementation
}

export async function putReview(req, res) {
  // Implementation
}

export async function deleteReview(req, res) {
  // Implementation
}