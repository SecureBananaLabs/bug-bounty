const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  if (payload?.reviewerId === payload?.revieweeId) {
    throw new RangeError("Review reviewer and reviewee must be different users");
  }

  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
