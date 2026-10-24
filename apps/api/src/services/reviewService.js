const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignoredId, ...clientFields } = payload ?? {};
  const review = { ...clientFields, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}
