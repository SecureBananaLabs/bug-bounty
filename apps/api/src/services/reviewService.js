import crypto from "node:crypto";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _clientProvidedId, ...rest } = payload;
  const review = { id: `rev_${crypto.randomUUID()}`, ...rest };
  reviews.push(review);
  return review;
}
