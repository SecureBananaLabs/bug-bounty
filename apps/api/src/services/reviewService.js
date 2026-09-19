import { createServiceId } from "../utils/ids.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { ...payload, id: createServiceId("rev") };
  reviews.push(review);
  return review;
}
