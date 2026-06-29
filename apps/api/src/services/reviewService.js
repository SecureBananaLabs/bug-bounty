const reviews = [];

export async function listReviews() {
  return [...reviews];
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  // Ensure server-owned timestamp
  review.createdAt = new Date().toISOString();
  reviews.push(review);
  return review;
}
