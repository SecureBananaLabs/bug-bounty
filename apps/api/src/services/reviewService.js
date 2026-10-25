const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { jobId, reviewerId, rating, comment } = payload;
  const review = {
    jobId,
    reviewerId,
    rating,
    comment,
    id: `rev_${Date.now()}`
  };
  reviews.push(review);
  return review;
}
