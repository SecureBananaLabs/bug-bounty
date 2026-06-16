const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { rating, comment, jobId, freelancerId, clientId } = payload;
  const review = { id: `rev_${Date.now()}`, rating, comment, jobId, freelancerId, clientId };
  reviews.push(review);
  return review;
}
