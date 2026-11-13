import { snapshotRecord, snapshotRecords } from "../utils/snapshot.js";

const reviews = [];

export async function listReviews() {
  return snapshotRecords(reviews);
}

export async function createReview(payload) {
  const review = snapshotRecord({ id: `rev_${Date.now()}`, ...payload });
  reviews.push(review);
  return snapshotRecord(review);
}
