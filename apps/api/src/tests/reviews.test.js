/**
 * @file reviews.test.js
 * Unit tests for reviewService and aggregate rating computations.
 */

import assert from 'assert';
import {
  createReview,
  getFreelancerRating,
  computeAverageRating,
  _resetReviewsForTesting,
} from '../services/reviewService.js';

async function runTests() {
  console.log('Running reviewService unit tests...');

  _resetReviewsForTesting();

  // Test 1: Empty freelancer reviews returns 0 and 0
  {
    const rating = await getFreelancerRating('user_non_existent');
    assert.deepStrictEqual(rating, { averageRating: 0, totalReviews: 0 });
    console.log('✔ Test 1 passed: Default rating for freelancer without reviews');
  }

  // Test 2: Calculate aggregate average from multiple reviews
  {
    await createReview({ freelancerId: 'freelancer_123', rating: 5, comment: 'Excellent work!' });
    await createReview({ freelancerId: 'freelancer_123', rating: 4, comment: 'Very good' });
    await createReview({ freelancerId: 'freelancer_123', rating: 4, comment: 'Solid delivery' });

    const stats = await getFreelancerRating('freelancer_123');
    // (5 + 4 + 4) / 3 = 13 / 3 = 4.3333... -> rounded to 4.3
    assert.strictEqual(stats.averageRating, 4.3);
    assert.strictEqual(stats.totalReviews, 3);
    console.log('✔ Test 2 passed: Multiple reviews average rounded to 1 decimal');
  }

  // Test 3: Multiple freelancers remain isolated
  {
    await createReview({ freelancerId: 'freelancer_456', rating: 1, comment: 'Did not meet requirements' });
    await createReview({ freelancerId: 'freelancer_456', rating: 2, comment: 'Late response' });

    const stats456 = await getFreelancerRating('freelancer_456');
    assert.strictEqual(stats456.averageRating, 1.5);
    assert.strictEqual(stats456.totalReviews, 2);

    const stats123 = await getFreelancerRating('freelancer_123');
    assert.strictEqual(stats123.averageRating, 4.3);
    assert.strictEqual(stats123.totalReviews, 3);
    console.log('✔ Test 3 passed: Freelancer rating isolation');
  }

  // Test 4: Pure rating list calculation helper
  {
    const pureStats = computeAverageRating([5, 5, 5, 4]);
    // 19 / 4 = 4.75 -> 4.8
    assert.strictEqual(pureStats.averageRating, 4.8);
    assert.strictEqual(pureStats.totalReviews, 4);

    const emptyStats = computeAverageRating([]);
    assert.deepStrictEqual(emptyStats, { averageRating: 0, totalReviews: 0 });
    console.log('✔ Test 4 passed: Pure computeAverageRating calculation helper');
  }

  // Test 5: Invalid ratings out of range or NaN are filtered out
  {
    const filtered = computeAverageRating([5, null, undefined, -1, 10, 'NaN', 4]);
    assert.strictEqual(filtered.averageRating, 4.5);
    assert.strictEqual(filtered.totalReviews, 2);
    console.log('✔ Test 5 passed: Out-of-bounds and invalid ratings filtered safely');
  }

  console.log('All reviewService tests passed successfully!');
}

runTests();
