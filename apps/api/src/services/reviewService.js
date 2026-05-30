const sanitize = (s) => String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview({...payload, comment: sanitize(payload.comment||"")}) {
  const review = { id: `rev_${Date.now()}`, ...payload };
  reviews.push(review);
  return review;
}
