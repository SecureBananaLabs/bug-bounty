import { randomUUID } from "node:crypto";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { ...payload, id: `rev_${randomUUID()}` };
  reviews.push(review);
  return review;
}
