/**
 * @file reviewValidator.test.js
 * Unit tests for review creation validator and comment length bounds (5-1000 chars).
 */

import assert from 'assert';
import {
  isValidRating,
  isValidReviewComment,
  validateCreateReview,
} from '../validators/review.js';

function runTests() {
  console.log('Running review validator unit tests...');

  // Test 1: Valid comments (5 to 1000 characters)
  {
    const validComments = [
      'Great',                         // 5 chars
      'Excellent work on the project!', // 29 chars
      'a'.repeat(1000),                // 1000 chars
      '  Leading and trailing whitespace  ', // Trimmed length > 5
    ];

    for (const comment of validComments) {
      assert.strictEqual(isValidReviewComment(comment), true, `Failed on valid comment: ${comment}`);
      const res = validateCreateReview({
        rating: 5,
        comment,
        freelancerId: 'free_123',
        contractId: 'ctr_456',
      });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.rating, 5);
      assert.strictEqual(res.data.comment, comment.trim());
    }
    console.log('✔ Test 1 passed: Valid comments and ratings accepted');
  }

  // Test 2: Invalid comment lengths (< 5 or > 1000 chars) and malformed inputs
  {
    const invalidComments = [
      'Good',                          // 4 chars (too short)
      'A',                             // 1 char
      '   ',                           // Empty after trim
      'a'.repeat(1001),                // 1001 chars (too long)
      '',
      null,
      undefined,
      12345,
    ];

    for (const comment of invalidComments) {
      assert.strictEqual(isValidReviewComment(comment), false, `Should reject invalid comment: ${comment}`);
      const res = validateCreateReview({ rating: 4, comment });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Review comment must be between 5 and 1000 characters');
    }
    console.log('✔ Test 2 passed: Invalid comment lengths rejected with strict error message');
  }

  // Test 3: Invalid ratings (0, 6, -1, float, NaN, null)
  {
    const invalidRatings = [0, 6, -1, 3.5, NaN, 'invalid', null, undefined];

    for (const rating of invalidRatings) {
      assert.strictEqual(isValidRating(rating), false, `Should reject invalid rating: ${rating}`);
      const res = validateCreateReview({ rating, comment: 'Valid comment here' });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Rating must be an integer between 1 and 5');
    }
    console.log('✔ Test 3 passed: Invalid ratings rejected safely');
  }

  // Test 4: Null and non-object payloads
  {
    assert.deepStrictEqual(validateCreateReview(null), { valid: false, error: 'Valid review payload is required' });
    assert.deepStrictEqual(validateCreateReview('string'), { valid: false, error: 'Valid review payload is required' });
    console.log('✔ Test 4 passed: Non-object payloads handled safely');
  }

  console.log('All review validator tests passed successfully!');
}

runTests();
