const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  if (payload.rating !== undefined && (typeof payload.rating !== "number" || payload.rating < 1 || payload.rating > 5)) {
    throw new Error("Rating must be between 1 and 5");
  }
  const { reviewerId, targetId, rating, comment } = payload;
  const review = { id: `rev_${Date.now()}`, reviewerId, targetId, rating, comment };
  reviews.push(review);
  return review;
}