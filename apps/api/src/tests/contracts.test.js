const { validateMilestoneTransition } = require('../services/contractService');

describe('validateMilestoneTransition', () => {
  describe('valid transitions', () => {
    test('pending -> in_progress', () => {
      expect(validateMilestoneTransition('pending', 'in_progress')).toBe(true);
    });

    test('in_progress -> submitted', () => {
      expect(validateMilestoneTransition('in_progress', 'submitted')).toBe(true);
    });

    test('submitted -> approved', () => {
      expect(validateMilestoneTransition('submitted', 'approved')).toBe(true);
    });

    test('approved -> paid', () => {
      expect(validateMilestoneTransition('approved', 'paid')).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    test('approved -> pending (backward)', () => {
      expect(validateMilestoneTransition('approved', 'pending')).toBe(false);
    });

    test('paid -> in_progress (backward)', () => {
      expect(validateMilestoneTransition('paid', 'in_progress')).toBe(false);
    });

    test('pending -> submitted (skip in_progress)', () => {
      expect(validateMilestoneTransition('pending', 'submitted')).toBe(false);
    });

    test('in_progress -> approved (skip submitted)', () => {
      expect(validateMilestoneTransition('in_progress', 'approved')).toBe(false);
    });

    test('submitted -> paid (skip approved)', () => {
      expect(validateMilestoneTransition('submitted', 'paid')).toBe(false);
    });

    test('completed -> in_progress (invalid status)', () => {
      expect(validateMilestoneTransition('completed', 'in_progress')).toBe(false);
    });

    test('pending -> pending (same status)', () => {
      expect(validateMilestoneTransition('pending', 'pending')).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('null currentStatus', () => {
      expect(validateMilestoneTransition(null, 'in_progress')).toBe(false);
    });

    test('undefined newStatus', () => {
      expect(validateMilestoneTransition('pending', undefined)).toBe(false);
    });

    test('empty string currentStatus', () => {
      expect(validateMilestoneTransition('', 'in_progress')).toBe(false);
    });

    test('empty string newStatus', () => {
      expect(validateMilestoneTransition('pending', '')).toBe(false);
    });

    test('unknown currentStatus', () => {
      expect(validateMilestoneTransition('unknown', 'in_progress')).toBe(false);
    });
  });
});