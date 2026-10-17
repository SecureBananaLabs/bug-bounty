const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}

export async function listReviewsByJob(jobId) {
  return reviews.filter((r) => r.jobId === jobId);
}
