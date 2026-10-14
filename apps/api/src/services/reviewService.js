const reviews = [];

export async function listReviews() {
  return reviews.map(r => ({ ...r }));
}

export async function createReview(payload) {
  const { reviewerId, targetId, rating, comment } = payload;
  const review = { id: `rev_${Date.now()}`, reviewerId, targetId, rating, comment };
  reviews.push(review);
  return { ...review };
}
