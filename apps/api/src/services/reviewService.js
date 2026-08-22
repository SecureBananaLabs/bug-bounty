import { snapshotRecord } from "./recordSnapshot.js";

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = snapshotRecord({ id: `rev_${Date.now()}`, ...payload });
  reviews.push(review);
  return snapshotRecord(review);
}
