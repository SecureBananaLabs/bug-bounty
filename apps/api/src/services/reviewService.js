const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id, ...safePayload } = payload;
  const review = { ...safePayload, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}
