const reviews = [];

export async function listReviews() {
  // Return an independent snapshot so callers cannot mutate the stored collection.
  return [...reviews];
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
