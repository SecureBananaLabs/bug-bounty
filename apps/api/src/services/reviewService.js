const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignoredId, ...rest } = payload;
  const review = { id: `rev_${Date.now()}`, ...rest };
  reviews.push(review);
  return review;
}
