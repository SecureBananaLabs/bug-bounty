import crypto from "node:crypto";

const reviews = [];

export async function listReviews() {
  return [...reviews];
}

export async function createReview(payload = {}) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { id: _ignoredId, ...rest } = safePayload;
  const review = {
    ...rest,
    id: `rev_${crypto.randomUUID()}`
  };
  reviews.push(review);
  return review;
}
