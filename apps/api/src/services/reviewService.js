const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  // eslint-disable-next-line no-unused-vars
  const { id: _id, ...safe } = payload;
  const review = { id: `rev_${Date.now()}`, ...safe };
  reviews.push(review);
  return review;
}
