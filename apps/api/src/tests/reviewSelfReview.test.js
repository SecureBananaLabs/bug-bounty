/**
 * @file reviewSelfReview.test.js
 * Unit tests verifying self-review prevention and review validation.
 */

import assert from 'assert';
import { validateCreateReview } from '../validators/review.js';
import { postReview } from '../controllers/reviewController.js';

async function runTests() {
  console.log('Running self-review prevention unit tests...');

  // Test 1: Self-review rejected (reviewerId === revieweeId / targetUserId)
  {
    const selfReviewPayload = {
      reviewerId: 'usr_freelancer_777',
      revieweeId: 'usr_freelancer_777',
      rating: 5,
      comment: 'I am the best developer on this platform!',
    };

    const res = validateCreateReview(selfReviewPayload);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Users cannot submit reviews for themselves');

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (d) => {
            jsonResult = d;
            return d;
          },
        };
      },
    };

    await postReview({ body: selfReviewPayload }, mockRes);
    assert.strictEqual(statusCalled, 400);
    assert.strictEqual(jsonResult.success, false);
    assert.strictEqual(jsonResult.message, 'Users cannot submit reviews for themselves');
    console.log('✔ Test 1 passed: Self-review rejected with HTTP 400 Bad Request');
  }

  // Test 2: Distinct reviewer and reviewee accepted (201 Created)
  {
    const validPayload = {
      reviewerId: 'usr_client_111',
      revieweeId: 'usr_freelancer_777',
      rating: 5,
      comment: 'Outstanding delivery and excellent communication throughout the project.',
    };

    const res = validateCreateReview(validPayload);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.data.reviewerId, 'usr_client_111');
    assert.strictEqual(res.data.revieweeId, 'usr_freelancer_777');

    let statusCalled = 0;
    let jsonResult = null;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (d) => {
            jsonResult = d;
            return d;
          },
        };
      },
    };

    await postReview({ body: validPayload }, mockRes);
    assert.strictEqual(statusCalled, 201);
    assert.strictEqual(jsonResult.success, true);
    console.log('✔ Test 2 passed: Distinct reviewer and reviewee accepted with HTTP 201');
  }

  console.log('All self-review tests passed successfully!');
}

runTests();
