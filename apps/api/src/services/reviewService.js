import { randomUUID } from "crypto";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload = {}) {
  const { id: _ignoredId, ...safePayload } = payload;
  const review = {
    ...safePayload,
    id: `rev_${Date.now()}_${randomUUID().slice(0, 8)}`,
  };
  reviews.push(review);
  return review;
}
