const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { ...payload, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}
