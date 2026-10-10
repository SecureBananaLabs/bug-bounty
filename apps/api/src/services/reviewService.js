const reviews = [];

// Monotonically increasing suffix to guarantee uniqueness even when two reviews
// are created within the same millisecond. Combined with Date.now() the
// resulting id stays sortable by creation time and collision-resistant.
let reviewCounter = 0;

function nextReviewId() {
  reviewCounter += 1;
  return `rev_${Date.now()}_${reviewCounter}`;
}

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: nextReviewId(), ...payload };
  reviews.push(review);
  return review;
}
