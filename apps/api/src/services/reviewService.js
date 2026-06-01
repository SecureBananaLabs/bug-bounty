const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const rating = Number(payload.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error("Review rating must be an integer from 1 to 5");
    error.statusCode = 400;
    throw error;
  }

  const review = { id: `rev_${Date.now()}`, ...payload, rating };
  reviews.push(review);
  return review;
}
