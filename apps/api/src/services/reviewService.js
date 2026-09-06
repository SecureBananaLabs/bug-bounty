const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    rating: payload.rating,
    comment: payload.comment,
    reviewerId: payload.reviewerId,
    revieweeId: payload.revieweeId
  };
  reviews.push(review);
  return review;
}
