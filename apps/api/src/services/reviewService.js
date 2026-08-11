const reviews = [];

export async function listReviews() {
  return [...reviews];
}

export async function createReview(payload) {
  const rating = payload.rating;

  // 1. If payload contains rating, enforce dynamic type/range checks
  if (rating !== undefined && rating !== null) {
    // Reject non-number values
    if (typeof rating !== "number") {
      throw new Error("Rating must be a number");
    }

    // Reject non-integer values
    if (!Number.isInteger(rating)) {
      throw new Error("Rating must be an integer");
    }

    // Reject ratings outside 1-5 range
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be an integer between 1 and 5");
    }
  }

  // 2. Reject self-reviews: reviewerId must not be equal to revieweeId
  if (payload.reviewerId && payload.revieweeId && payload.reviewerId === payload.revieweeId) {
    throw new Error("Reviewer and reviewee cannot be the same user");
  }

  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
