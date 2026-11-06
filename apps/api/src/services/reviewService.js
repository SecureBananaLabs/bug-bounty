import { createResourceId } from "../utils/id.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { ...payload, id: createResourceId("rev") };
  reviews.push(review);
  return review;
}
