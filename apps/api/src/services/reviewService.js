const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload, user) {
  const { id, reviewerId, ...reviewFields } = payload;
  const review = {
    ...reviewFields,
    id: `rev_${Date.now()}`,
    reviewerId: user.sub
  };
  reviews.push(review);
  return review;
}
