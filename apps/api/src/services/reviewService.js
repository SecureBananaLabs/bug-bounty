const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id, ...rest } = payload;
  const review = { ...rest, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}
