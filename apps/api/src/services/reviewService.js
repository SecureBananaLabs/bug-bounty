const reviews = [];
let reviewCounter = 0;

function generateReviewId() {
  reviewCounter++;
  return `rev_${Date.now()}_${reviewCounter}`;
}

/** @internal Test-only: clear all stored reviews */
export function _reset() {
  reviews.length = 0;
}

export async function listReviews() {
  return reviews;
}

export async function createReview(payload = {}) {
  const review = {
    ...payload,
    id: generateReviewId(),
  };
  reviews.push(review);
  return review;
}
