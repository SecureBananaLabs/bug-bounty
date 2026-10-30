/**
 * @file reviews.test.js
 * Unit tests for review creation validation and aggregate rating computation.
 */

import assert from 'assert';
import {
  createReviewSchema,
  validateCreateReview,
  isValidRating,
  isValidReviewComment,
} from '../validators/review.js';
import { postReview } from '../controllers/reviewController.js';
import {
  createReview,
  getFreelancerRating,
  computeAverageRating,
  _resetReviewsForTesting,
} from '../services/reviewService.js';

async function runTests() {
  console.log('Running review validation unit tests...');

  // Test 1: Valid review creation (201 Created)
  {
    const validPayload = {
      targetUserId: 'usr_dev999',
      rating: 5,
      comment: 'Excellent full-stack engineering and prompt delivery!',
      contractId: 'ctr_123',
    };

    const validation = validateCreateReview(validPayload);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.data.targetUserId, 'usr_dev999');
    assert.strictEqual(validation.data.rating, 5);

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => {
            jsonResult = data;
            return data;
          },
        };
      },
    };

    await postReview({ body: validPayload }, mockRes);
    assert.strictEqual(statusCalled, 201);
    assert.strictEqual(jsonResult.success, true);
    console.log('✔ Test 1 passed: Valid review payload accepted with HTTP 201');
  }

  // Test 2: Invalid rating (out of range, zero, negative, floating point)
  {
    const invalidRatings = [0, -1, 6, 10, 3.5, 'five'];

    for (const r of invalidRatings) {
      const res = validateCreateReview({
        targetUserId: 'usr_dev999',
        rating: r,
        comment: 'Valid comment length',
      });
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes('rating'));
    }
    console.log('✔ Test 2 passed: Invalid ratings rejected with HTTP 400');
  }

  // Test 3: Short comment (< 5 chars) or empty comment
  {
    const res = validateCreateReview({
      targetUserId: 'usr_dev999',
      rating: 4,
      comment: 'Good',
    });
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('5 and 1000 characters'));
    console.log('✔ Test 3 passed: Short review comments rejected');
  }

  // Test 4: Missing targetUserId
  {
    const res = validateCreateReview({
      rating: 5,
      comment: 'Super fast delivery and great communication.',
    });
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('targetUserId'));
    console.log('✔ Test 4 passed: Missing targetUserId rejected');
  }

  // Test 5: getFreelancerRating and computeAverageRating
  {
    _resetReviewsForTesting();

    await createReview({ freelancerId: 'freelancer_1', rating: 5 });
    await createReview({ freelancerId: 'freelancer_1', rating: 4 });
    await createReview({ freelancerId: 'freelancer_1', rating: 4 });

    const stats = await getFreelancerRating('freelancer_1');
    assert.strictEqual(stats.totalReviews, 3);
    assert.strictEqual(stats.averageRating, 4.3);

    const emptyStats = await getFreelancerRating('non_existent');
    assert.strictEqual(emptyStats.totalReviews, 0);
    assert.strictEqual(emptyStats.averageRating, 0);
    console.log('✔ Test 5 passed: Aggregate rating average computation');
  }

  console.log('All review validation tests passed successfully!');
}

runTests();
