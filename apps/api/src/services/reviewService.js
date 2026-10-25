const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  // Server-controlled id must come AFTER spread to prevent injection.
  const review = { ...payload, id: `rev_${Date.now()}` };
  reviews.push(review);
  return review;
}

