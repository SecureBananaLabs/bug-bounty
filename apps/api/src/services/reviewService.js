const reviews = [];

export async function listReviews() {
  return reviews.map((review) => ({ ...review }));
}

export async function createReview(payload) {
  const review = { ...payload, id: `rev_${Date.now()}` };
  reviews.push(review);
  return { ...review };
}
