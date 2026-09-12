const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(reviewerId, validatedData) {
  const review = {
    id: `rev_${Date.now()}`,
    reviewerId,
    targetUserId: validatedData.targetUserId,
    jobId: validatedData.jobId,
    rating: validatedData.rating,
    comment: validatedData.comment,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  return review;
}
