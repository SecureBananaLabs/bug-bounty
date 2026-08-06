import { createId } from "../utils/ids.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id, ...reviewPayload } = payload;
  const review = { ...reviewPayload, id: createId("rev") };
  reviews.push(review);
  return review;
}

export function resetReviews() {
  reviews.length = 0;
}
