const reviews = [];

export async function listReviews(freelancerId) {
  if (freelancerId) {
    return reviews.filter((r) => r.freelancerId === freelancerId);
  }
  return reviews;
}

export async function createReview(payload) {
  const review = { id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...payload };
  reviews.push(review);
  return review;
}

export async function getFreelancerRating(freelancerId) {
  const matching = reviews.filter((r) => r.freelancerId === freelancerId && typeof r.rating === 'number');
  if (matching.length === 0) {
    return { averageRating: 0.0, totalReviews: 0 };
  }

  const sum = matching.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / matching.length) * 10) / 10;
  return { averageRating: avg, totalReviews: matching.length };
}
