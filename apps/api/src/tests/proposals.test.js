/**
 * @file proposals.test.js
 * Unit tests for proposal creation validator, duration/days bounds, and proposalController handling.
 */

import assert from 'assert';
import {
  createProposalSchema,
  isValidEstimatedDuration,
  validateCreateProposal,
} from '../validators/proposal.js';
import { postProposal } from '../controllers/proposalController.js';

async function runTests() {
  console.log('Running proposal validation unit tests...');

  // Test 1: Valid proposal creation with proper estimatedDuration / estimatedDays (HTTP 201)
  {
    const validPayloads = [
      {
        jobId: 'job_123',
        freelancerId: 'usr_456',
        coverLetter: 'I have 5+ years of experience delivering full-stack solutions.',
        bidAmount: 1500,
        estimatedDuration: '2 weeks',
      },
      {
        jobId: 'job_789',
        coverLetter: 'Expert React Native engineer with 10 published mobile applications.',
        bidAmount: 2500,
        estimatedDays: 14,
      },
      {
        jobId: 'job_100',
        coverLetter: 'Senior DevOps Architect specializing in Kubernetes and Terraform.',
        bidAmount: 5000,
        estimatedDuration: 'd'.repeat(100),
      },
    ];

    for (const payload of validPayloads) {
      if (payload.estimatedDuration) {
        assert.strictEqual(isValidEstimatedDuration(payload.estimatedDuration), true);
      }
      const res = validateCreateProposal(payload);
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.jobId, payload.jobId);
      assert.strictEqual(res.data.bidAmount, payload.bidAmount);

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

      await postProposal({ body: payload }, mockRes);
      assert.strictEqual(statusCalled, 201);
      assert.strictEqual(jsonResult.success, true);
    }
    console.log('✔ Test 1 passed: Valid proposal payloads accepted with HTTP 201');
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
    }
    console.log('✔ Test 2 passed: Invalid estimatedDuration strings rejected with errors');
  }

  // Test 3: Invalid bidAmount (negative, zero, NaN) (HTTP 400)
  {
    const invalidAmounts = [0, -100, NaN, 'one hundred'];

    for (const amt of invalidAmounts) {
      const payload = {
        jobId: 'job_123',
        freelancerId: 'usr_456',
        coverLetter: 'I have 5+ years of experience delivering full-stack solutions.',
        bidAmount: amt,
        estimatedDuration: '2 weeks',
      };
      const res = validateCreateProposal(payload);
      assert.strictEqual(res.success, false);

      let statusCalled = 0;
      const mockRes = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (data) => data,
          };
        },
      };

      await postProposal({ body: payload }, mockRes);
      assert.strictEqual(statusCalled, 400);
    }
    console.log('✔ Test 3 passed: Non-positive bid amounts rejected with HTTP 400');
  }

  // Test 4: Short cover letter (< 10 chars)
  {
    const payload = {
      jobId: 'job_123',
      freelancerId: 'usr_456',
      coverLetter: 'Hi',
      bidAmount: 500,
      estimatedDuration: '1 week',
    };
    const res = validateCreateProposal(payload);
    assert.strictEqual(res.success, false);
    assert.ok(res.errors.some((e) => e.includes('10 characters')));

    let statusCalled = 0;
    const mockRes = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => data,
        };
      },
    };

    await postProposal({ body: payload }, mockRes);
    assert.strictEqual(statusCalled, 400);
    console.log('✔ Test 4 passed: Short cover letter rejected with HTTP 400');
  }

  // Test 5: Missing jobId
  {
    const payload = {
      coverLetter: 'I have 5+ years of experience delivering full-stack solutions.',
      bidAmount: 500,
    };
    const res = validateCreateProposal(payload);
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('jobId'));
    console.log('✔ Test 5 passed: Missing jobId rejected');
  }

  console.log('All proposal validation tests passed successfully!');
}

runTests();
