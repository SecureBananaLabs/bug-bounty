const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignored, ...safe } = payload;
  const review = { ...safe, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}
