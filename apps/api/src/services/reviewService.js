const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}

export async function getReviewById(id) {
  return reviews.find((r) => r.id === id) || null;
}
