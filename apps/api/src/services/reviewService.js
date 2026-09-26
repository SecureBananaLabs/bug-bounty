import { snapshotRecords } from "./snapshot.js";

const reviews = [];

export async function listReviews() {
  return snapshotRecords(reviews);
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
