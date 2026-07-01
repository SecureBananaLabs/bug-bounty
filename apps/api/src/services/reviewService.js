const reviews = [];

export async function listReviews({ skip = 0, limit = 20 } = {}) {
  return { items: reviews.slice(skip, skip + limit), total: reviews.length };
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
