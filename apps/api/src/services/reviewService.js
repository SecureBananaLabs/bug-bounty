const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    jobId: payload.jobId,
    reviewerId: payload.reviewerId,
    rating: payload.rating,
    comment: payload.comment
  };
  reviews.push(review);
  return review;
}
