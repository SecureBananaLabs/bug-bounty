const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { jobId, reviewerId, rating, comment } = payload;
  const review = {
    id: `rev_${Date.now()}`,
    jobId,
    reviewerId,
    rating,
    comment
  };
  reviews.push(review);
  return review;
}
