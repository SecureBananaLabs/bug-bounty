const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignored, ...safePayload } = payload;
  const review = { id: `rev_${Date.now()}`, ...safePayload };
  reviews.push(review);
  return review;
}
