'use strict';

/**
 * Job payload validation.
 *
 * Resolves #2853 (duplicate reports: #2835, #2827):
 * reject inverted budget ranges where budgetMin > budgetMax.
 */

const NUMERIC_FIELDS = ['budgetMin', 'budgetMax'];

/**
 * Validate a raw job payload.
 *
 * @param {object} payload
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateJobPayload(payload) {
  const errors = [];
  const job = payload && typeof payload === 'object' ? payload : {};

  // --- Per-field validation (pre-existing behavior, preserved) ---
  for (const field of NUMERIC_FIELDS) {
    const value = job[field];
    if (value === undefined || value === null) continue; // optional / unbounded

    if (typeof value !== 'number' || Number.isNaN(value)) {
      errors.push({ field, message: `${field} must be a number` });
      continue;
    }
    if (!Number.isFinite(value)) {
      errors.push({ field, message: `${field} must be a finite number` });
      continue;
    }
    if (value < 0) {
      errors.push({ field, message: `${field} must not be negative` });
    }
  }

  // --- Cross-field validation (NEW: reject inverted ranges) ---
  const min = job.budgetMin;
  const max = job.budgetMax;

  const minOk = typeof min === 'number' && Number.isFinite(min) && min >= 0;
  const maxOk = typeof max === 'number' && Number.isFinite(max) && max >= 0;

  // Only assert ordering when BOTH bounds are present and individually valid.
  // A missing bound means "unbounded" and is always acceptable.
  if (minOk && maxOk && min > max) {
    errors.push({
      field: 'budgetMax',
      message: 'budgetMax must be greater than or equal to budgetMin',
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Express middleware wrapper: responds 400 with the structured error list
 * when the payload contains an inverted (or otherwise invalid) budget range.
 */
function validateJobMiddleware(req, res, next) {
  const result = validateJobPayload(req.body);
  if (!result.valid) {
    return res.status(400).json({
      error: 'Invalid job payload',
      details: result.errors,
    });
  }
  return next();
}

module.exports = { validateJobPayload, validateJobMiddleware };
