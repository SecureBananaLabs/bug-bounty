const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    throw new Error("Review rating must be an integer between 1 and 5");
  }

  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
