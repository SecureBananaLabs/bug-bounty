# Job validation should reject inverted budget ranges

## Bug

The job-validation path accepts a `budget` object whose `min` is greater than its `max` (e.g. `{min: 5000, max: 1000}`). An inverted range is never satisfiable: every downstream filter/query that expects `min <= amount <= max` silently matches nothing (or, worse, a `min`-only comparison lets an impossible range through). This is the same defect class as #2853/#2827 — reject it at the validation boundary.

## Fix

`src/validation/job.js` — add an explicit range check that rejects inverted budgets (and negatives) with a clear error.

```js
/**
 * Validate a job posting payload.
 * Rejects inverted budget ranges (min > max) and non-positive bounds.
 */
function validateJob(job) {
  const errors = [];

  if (!job || typeof job !== 'object') {
    return { valid: false, errors: ['job payload must be an object'] };
  }

  const { budget } = job;

  if (budget != null) {
    if (typeof budget !== 'object') {
      errors.push('budget must be an object with min/max');
    } else {
      const { min, max } = budget;

      if (min != null && (typeof min !== 'number' || Number.isNaN(min))) {
        errors.push('budget.min must be a number');
      }
      if (max != null && (typeof max !== 'number' || Number.isNaN(max))) {
        errors.push('budget.max must be a number');
      }
      if (typeof min === 'number' && typeof max === 'number') {
        if (min < 0 || max < 0) {
          errors.push('budget bounds must be non-negative');
        }
        if (min > max) {
          errors.push(
            `inverted budget range: min (${min}) must be <= max (${max})`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateJob };
```

## Tests

```js
const { validateJob } = require('../src/validation/job');

test('rejects inverted budget range', () => {
  const r = validateJob({ budget: { min: 5000, max: 1000 } });
  expect(r.valid).toBe(false);
  expect(r.errors.join(' ')).toMatch(/inverted budget range/);
});

test('accepts a valid range', () => {
  expect(validateJob({ budget: { min: 1000, max: 5000 } }).valid).toBe(true);
});

test('accepts an equal range', () => {
  expect(validateJob({ budget: { min: 1000, max: 1000 } }).valid).toBe(true);
});

test('rejects negative bounds', () => {
  expect(validateJob({ budget: { min: -1, max: 10 } }).valid).toBe(false);
});
```

Run: `npx jest tests/job-validation.test.js`
