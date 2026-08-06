const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    content: payload.content,
    rating: payload.rating,
  };
  reviews.push(review);
  return review;
}