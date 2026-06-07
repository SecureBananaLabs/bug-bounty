const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id, ...reviewPayload } = payload;
  const review = { id: `rev_${Date.now()}`, ...reviewPayload };
  reviews.push(review);
  return review;
}
