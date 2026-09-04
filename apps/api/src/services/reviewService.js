const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  return review;
}
