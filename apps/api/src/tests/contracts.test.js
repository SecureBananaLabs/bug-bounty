import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateMilestoneTransition } from '../services/contractService.js';

describe('Contract Milestone Status Transitions', () => {
  it('allows valid sequential status progression', () => {
    assert.equal(validateMilestoneTransition('pending', 'in_progress'), true);
    assert.equal(validateMilestoneTransition('in_progress', 'submitted'), true);
    assert.equal(validateMilestoneTransition('submitted', 'approved'), true);
    assert.equal(validateMilestoneTransition('approved', 'paid'), true);
  });

  it('rejects invalid backwards transitions', () => {
    assert.equal(validateMilestoneTransition('approved', 'pending'), false);
    assert.equal(validateMilestoneTransition('paid', 'in_progress'), false);
    assert.equal(validateMilestoneTransition('cancelled', 'pending'), false);
  });

  it('allows rejection from submitted back to in_progress for revisions', () => {
    assert.equal(validateMilestoneTransition('submitted', 'in_progress'), true);
  });
});
