const reviews = [];

export async function listReviews() {
  return reviews;
}

function assertValidRating(rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new RangeError("Review rating must be an integer from 1 to 5");
  }
}

export async function createReview(payload) {
  assertValidRating(payload.rating);

  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
