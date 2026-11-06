/**
 * @file proposals.test.js
 * Unit tests for proposal creation validator and estimatedDuration bounds (1-100 chars).
 */

import assert from 'assert';
import {
  createProposalSchema,
  isValidEstimatedDuration,
  validateCreateProposal,
} from '../validators/proposal.js';

function runTests() {
  console.log('Running proposal validation unit tests...');

  // Test 1: Valid proposal creation with proper estimatedDuration
  {
    const validDurations = [
      '2 weeks',
      '1 month',
      '3-5 business days',
      'd'.repeat(100), // Exactly 100 chars
    ];

    for (const duration of validDurations) {
      assert.strictEqual(isValidEstimatedDuration(duration), true, `Failed on valid duration: ${duration}`);
      const res = validateCreateProposal({
        jobId: 'job_123',
        freelancerId: 'usr_456',
        coverLetter: 'I have 5+ years of experience delivering full-stack solutions.',
        bidAmount: 1500,
        estimatedDuration: duration,
      });
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.data.estimatedDuration, duration);
      assert.strictEqual(res.data.bidAmount, 1500);
    }
    console.log('✔ Test 1 passed: Valid proposal payloads accepted');
  }

  // Test 2: Invalid estimatedDuration (> 100 chars or empty)
  {
    const invalidDurations = [
      '',
      'd'.repeat(101), // 101 chars (too long)
      null,
      undefined,
      12345,
    ];

    for (const duration of invalidDurations) {
      assert.strictEqual(isValidEstimatedDuration(duration), false, `Should reject invalid duration: ${duration}`);
      const res = validateCreateProposal({
        jobId: 'job_123',
        freelancerId: 'usr_456',
        coverLetter: 'I have 5+ years of experience delivering full-stack solutions.',
        bidAmount: 1500,
        estimatedDuration: duration,
      });
      assert.strictEqual(res.success, false);
      assert.ok(res.errors.length > 0);
    }
    console.log('✔ Test 2 passed: Invalid estimatedDuration strings rejected with errors');
  }

  // Test 3: Invalid bidAmount (negative, zero, NaN)
  {
    const invalidAmounts = [0, -100, NaN, 'one hundred'];

    for (const amt of invalidAmounts) {
      const res = validateCreateProposal({
        jobId: 'job_123',
        freelancerId: 'usr_456',
        coverLetter: 'I have 5+ years of experience delivering full-stack solutions.',
        bidAmount: amt,
        estimatedDuration: '2 weeks',
      });
      assert.strictEqual(res.success, false);
    }
    console.log('✔ Test 3 passed: Non-positive bid amounts rejected');
  }

  // Test 4: Short cover letter (< 10 chars)
  {
    const res = validateCreateProposal({
      jobId: 'job_123',
      freelancerId: 'usr_456',
      coverLetter: 'Hi',
      bidAmount: 500,
      estimatedDuration: '1 week',
    });
    assert.strictEqual(res.success, false);
    assert.ok(res.errors.some((e) => e.includes('10 characters')));
    console.log('✔ Test 4 passed: Short cover letter rejected');
  }

  console.log('All proposal validation tests passed successfully!');
}

runTests();
