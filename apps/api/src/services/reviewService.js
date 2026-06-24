const reviews = [];

// Simple HTML entity encoder to prevent stored XSS
function sanitize(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = {
    id: `rev_${Date.now()}`,
    ...payload,
    comment: sanitize(payload.comment)
  };
  reviews.push(review);
  return review;
}
