import { createPublicId } from "../utils/publicId.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: createPublicId("rev"), ...payload };
  reviews.push(review);
  return review;
}
