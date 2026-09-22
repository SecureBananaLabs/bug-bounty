const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { targetUserId, jobId, rating, comment } = payload;
  const review = {
    id: `rev_${Date.now()}`,
    targetUserId,
    jobId,
    rating,
    comment
  };
  reviews.push(review);
  return review;
}
