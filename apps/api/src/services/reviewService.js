import { randomUUID } from "node:crypto";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: `rev_${randomUUID()}`, ...payload };
  reviews.push(review);
  return review;
}
