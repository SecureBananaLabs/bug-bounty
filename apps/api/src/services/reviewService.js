import crypto from "crypto";
const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: crypto.randomUUID(), ...payload };
  reviews.push(review);
  return review;
}