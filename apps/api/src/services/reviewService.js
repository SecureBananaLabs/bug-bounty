const reviews = [];

export async function listReviews() {
  return [...reviews];
}

export async function createReview(payload) {
  if (payload.reviewerId === payload.revieweeId) {
    const error = new Error("Self-reviews are not allowed");
    error.status = 400;
    throw error;
  }
  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error("Rating must be an integer between 1 and 5");
    error.status = 400;
    throw error;
  }
  const review = { id: `rev_${Date.now()}`, ...payload, rating };
  reviews.push(review);
  return review;
}
