import { generateId } from '../utils/id.js';

const reviews = [];

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const review = { id: generateId('rev_'), ...payload };
  reviews.push(review);
  return review;
}

