const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  if (!payload.rating || !Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    const err = new Error("Rating must be an integer between 1 and 5");
    err.status = 400;
    throw err;
  }
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
