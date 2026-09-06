const reviews = [];

export async function listReviews() {
  return reviews.map((r) => ({ ...r }));
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return { ...review };
}
