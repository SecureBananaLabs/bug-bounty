const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    jobId: payload.jobId,
    reviewerId: payload.reviewerId,
    targetUserId: payload.targetUserId,
    rating: payload.rating,
    comment: payload.comment,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  return review;
}
