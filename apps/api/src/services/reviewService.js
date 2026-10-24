const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignored, ...safe } = payload;
  const review = { id: `rev_${Date.now()}`, ...safe };
  reviews.push(review);
  return review;
}
