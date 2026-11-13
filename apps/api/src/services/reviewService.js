import { cloneRecord, cloneRecords } from "../utils/records.js";

const reviews = [];

export async function listReviews() {
  return cloneRecords(reviews);
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return cloneRecord(review);
}
