const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const existing = reviews.find(
    (r) => r.reviewerId === payload.reviewerId && r.targetId === payload.targetId
  );
  if (existing) {
    throw new Error("You have already submitted a review for this target");
  }
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
