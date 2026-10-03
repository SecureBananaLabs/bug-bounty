/**
 * @file contracts.test.js
 * Unit tests for milestone status transition validator in contractService.
 */

import assert from 'assert';
import {
  validateMilestoneTransition,
  isValidMilestoneTransition,
  MILESTONE_STATUSES,
} from '../services/contractService.js';

function runTests() {
  console.log('Running contracts milestone transition unit tests...');

  // Test 1: Standard happy-path lifecycle transitions
  {
    assert.strictEqual(isValidMilestoneTransition('pending', 'in_progress'), true);
    assert.strictEqual(isValidMilestoneTransition('in_progress', 'submitted'), true);
    assert.strictEqual(isValidMilestoneTransition('submitted', 'approved'), true);
    assert.strictEqual(isValidMilestoneTransition('approved', 'paid'), true);
    console.log('✔ Test 1 passed: Standard lifecycle progression');
  }

  // Test 2: Submitted work revision request (submitted -> in_progress)
  {
    const res = validateMilestoneTransition('submitted', 'in_progress');
    assert.strictEqual(res.valid, true);
    console.log('✔ Test 2 passed: Revision request back to in_progress allowed');
  }

  // Test 3: Cancellation from active states
  {
    assert.strictEqual(isValidMilestoneTransition('pending', 'cancelled'), true);
    assert.strictEqual(isValidMilestoneTransition('in_progress', 'cancelled'), true);
    assert.strictEqual(isValidMilestoneTransition('submitted', 'cancelled'), true);
    console.log('✔ Test 3 passed: Cancellation from active states allowed');
  }

  // Test 4: Invalid backwards and illegal jump transitions
  {
    const illegalJumps = [
      ['pending', 'paid'],
      ['in_progress', 'paid'],
      ['approved', 'pending'],
      ['approved', 'in_progress'],
      ['paid', 'in_progress'],
      ['paid', 'approved'],
      ['cancelled', 'in_progress'],
      ['cancelled', 'paid'],
    ];

    for (const [from, to] of illegalJumps) {
      const res = validateMilestoneTransition(from, to);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(typeof res.message, 'string');
    }
    console.log('✔ Test 4 passed: Illegal jumps and backwards transitions rejected');
  }

  // Test 5: Same status transition rejected
  {
    const res = validateMilestoneTransition('in_progress', 'in_progress');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.message.includes('already in status'), true);
    console.log('✔ Test 5 passed: Redundant same-status transition rejected');
  }

  // Test 6: Invalid / null inputs handled gracefully
  {
    assert.strictEqual(validateMilestoneTransition(null, 'in_progress').valid, false);
    assert.strictEqual(validateMilestoneTransition('pending', null).valid, false);
    assert.strictEqual(validateMilestoneTransition('unknown_status', 'in_progress').valid, false);
    console.log('✔ Test 6 passed: Unknown and invalid status parameters handled');
  }

  console.log('All contracts milestone transition tests passed successfully!');
}

runTests();
