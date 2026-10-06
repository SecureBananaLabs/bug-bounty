/**
 * Job budget range validation.
 *
 * Issue #2827: "Reject inverted job budget ranges in job validation"
 *
 * Problem
 * -------
 * The job validation layer accepted any numeric `budgetMin` / `budgetMax`
 * pair without checking their relative order. A payload such as
 *   { budgetMin: 5000, budgetMax: 100 }
 * was therefore treated as a valid budget range even though it is inverted
 * (the minimum exceeds the maximum). Downstream code that assumes
 * `budgetMin <= budgetMax` (range filtering, escrow sizing, matching) then
 * silently produces empty or nonsensical results.
 *
 * Fix
 * ---
 * Validate the pair explicitly and reject inverted ranges with a clear,
 * structured error. The same guard applies to every entry point that
 * accepts a budget range (create + update) so the invariant cannot be
 * bypassed.
 */

'use strict';

class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 422;
  }
}

/**
 * Assert that a numeric value is a finite, non-negative number.
 */
function assertNonNegativeNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(field, `${field} must be a finite number`);
  }
  if (value < 0) {
    throw new ValidationError(field, `${field} must not be negative`);
  }
}

/**
 * Validate a job budget range.
 *
 * @param {object} input
 * @param {number} [input.budgetMin] - lower bound of the budget range
 * @param {number} [input.budgetMax] - upper bound of the budget range
 * @throws {ValidationError} when the range is malformed or inverted
 */
function validateBudgetRange(input) {
  if (input == null || typeof input !== 'object') {
    throw new ValidationError('budget', 'budget range is required');
  }

  const { budgetMin, budgetMax } = input;

  const hasMin = budgetMin !== undefined && budgetMin !== null;
  const hasMax = budgetMax !== undefined && budgetMax !== null;

  if (hasMin) assertNonNegativeNumber(budgetMin, 'budgetMin');
  if (hasMax) assertNonNegativeNumber(budgetMax, 'budgetMax');

  // Core fix for #2827: an inverted range is invalid.
  if (hasMin && hasMax && budgetMin > budgetMax) {
    throw new ValidationError(
      'budgetMax',
      `inverted budget range: budgetMin (${budgetMin}) must not exceed budgetMax (${budgetMax})`
    );
  }

  return true;
}

/**
 * Create-job entry point. Rejects inverted ranges before persisting.
 */
function validateCreateJob(payload) {
  validateBudgetRange(payload);
  return payload;
}

/**
 * Update-job entry point. Merges the partial update onto the existing job
 * first so that an inverted range cannot be introduced by updating only
 * one of the two bounds.
 */
function validateUpdateJob(existingJob, patch) {
  const merged = {
    budgetMin: patch.budgetMin !== undefined ? patch.budgetMin : existingJob.budgetMin,
    budgetMax: patch.budgetMax !== undefined ? patch.budgetMax : existingJob.budgetMax,
  };
  validateBudgetRange(merged);
  return Object.assign({}, existingJob, patch);
}

module.exports = {
  ValidationError,
  validateBudgetRange,
  validateCreateJob,
  validateUpdateJob,
};
