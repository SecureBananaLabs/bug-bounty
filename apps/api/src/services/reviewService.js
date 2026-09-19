import { snapshotList } from "./listSnapshot.js";

const reviews = [];

export async function listReviews() {
  return snapshotList(reviews);
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
