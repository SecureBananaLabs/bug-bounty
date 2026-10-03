<content>
import { v4 as uuidv4 } from 'uuid';

let reviews = [];

export async function createReview(payload) {
  const review = {
    id: uuidv4(),
    ...payload,
  };
  reviews.push(review);
  return review;
}

export async function listReviews() {
  return [...reviews];
}
</content>