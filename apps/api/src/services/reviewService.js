const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  // Validate rating range (1-5)
  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Object.assign(new Error("Rating must be an integer between 1 and 5"), { statusCode: 400 });
  }

  const review = {
    id: `rev_${Date.now()}`,
    reviewerId: payload.reviewerId,
    revieweeId: payload.revieweeId,
    rating,
    comment: payload.comment || "",
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  return review;
}
