const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { jobId, rating, comment } = payload;
  const review = {
    jobId,
    rating,
    comment,
    id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  return review;
}
