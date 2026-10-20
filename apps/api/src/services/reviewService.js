const reviews = [];

export async function listReviews() {
  return [...reviews];
}

export async function createReview(payload) {
  // Prevent self-reviews — a user reviewing themselves inflates their own
  // reputation score. The reviewerId comes from req.user.sub (server-side),
  // so this check cannot be bypassed by manipulating the request body.
  if (payload.reviewerId === payload.revieweeId) {
    throw Object.assign(new Error("Self-reviews are not permitted."), { status: 400 });
  }

  // Enforce integer rating in 1–5 range at service layer as a second
  // defence, even though the controller validator already checks this.
  const rating = payload.rating;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Object.assign(
      new Error("Rating must be an integer between 1 and 5."),
      { status: 400 }
    );
  }

  // Server-controlled fields come after the spread so they cannot be
  // overridden by client-supplied values.
  const review = {
    ...payload,
    id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  reviews.push(review);
  return review;
}
