import { createEntityId } from "../utils/ids.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: createEntityId("rev"), ...payload };
  reviews.push(review);
  return review;
}
