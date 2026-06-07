import { copyRecord, copyRecords } from "./copyRecord.js";

const reviews = [];

export async function listReviews() {
  return copyRecords(reviews);
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return copyRecord(review);
}
