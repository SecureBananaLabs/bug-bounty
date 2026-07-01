const reviews = [];

function serializeReview(review) {
  return { ...review };
}

export async function listReviews() {
  return reviews.map(serializeReview);
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return serializeReview(review);
}
