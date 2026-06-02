const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  if (payload.reviewerId === payload.revieweeId) {
    const error = new Error("Self-reviews are not allowed");
    error.status = 400;
    throw error;
  }
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
