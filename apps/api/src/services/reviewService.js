const reviews = [];

function copyReview(review) {
  return { ...review };
}

export async function listReviews() {
  return reviews.map(copyReview);
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return copyReview(review);
}
