const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id, ...reviewPayload } = payload;
  const review = { ...reviewPayload, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}
