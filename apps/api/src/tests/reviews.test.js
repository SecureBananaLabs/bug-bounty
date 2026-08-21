import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createReview, getFreelancerRating } from '../services/reviewService.js';

describe('Review Aggregate Rating Calculation', () => {
  it('computes correct average rating rounded to 1 decimal place', async () => {
    const fId = 'freelancer_777';

    await createReview({ freelancerId: fId, rating: 5, comment: 'Exceptional work!' });
    await createReview({ freelancerId: fId, rating: 4, comment: 'Great job.' });
    await createReview({ freelancerId: fId, rating: 5, comment: 'Highly recommended.' });

    const stats = await getFreelancerRating(fId);
    assert.equal(stats.totalReviews, 3);
    assert.equal(stats.averageRating, 4.7);
  });

  it('returns 0.0 average when freelancer has no reviews', async () => {
    const stats = await getFreelancerRating('nonexistent_user');
    assert.equal(stats.totalReviews, 0);
    assert.equal(stats.averageRating, 0.0);
  });
});
