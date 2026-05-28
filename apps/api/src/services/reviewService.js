import { createId } from "../utils/id.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: createId("rev"), ...payload };
  reviews.push(review);
  return review;
}
