const reviews = [];

export async function listReviews() {
  // Callers format or trim the list for their own response shape; handing out the
  // backing array would let one response rewrite what the next caller sees.
  return [...reviews];
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
