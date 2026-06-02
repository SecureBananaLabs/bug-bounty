const reviews = [];

export async function listReviews() {
  return [...reviews]; // Defensive copy
}

export async function createReview(payload) {
  const { rating, reviewerId, targetId, ...rest } = payload;
  
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }
  
  if (!reviewerId || !targetId) {
    throw new Error("reviewerId and targetId are required");
  }
  
  if (reviewerId === targetId) {
    throw new Error("Self-review is not allowed");
  }
  
  const review = {
    id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString(),
    rating,
    reviewerId,
    targetId,
    ...rest
  };
  reviews.push(review);
  return review;
}
