const { validateBudgetRange } = require('../src/utils/budget');

describe('validateBudgetRange utility', () => {
  test('returns valid when both bounds are undefined', () => {
    expect(validateBudgetRange(undefined, undefined)).toEqual({ valid: true });
  });

  test('returns valid when only budgetMin is defined', () => {
    expect(validateBudgetRange(50, undefined)).toEqual({ valid: true });
  });

  test('returns valid when only budgetMax is defined', () => {
    expect(validateBudgetRange(undefined, 100)).toEqual({ valid: true });
  });

  test('rejects when budgetMax < budgetMin', () => {
    const result = validateBudgetRange(100, 50);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('budgetMax must not be less than budgetMin');
  });

  test('accepts when budgetMax > budgetMin', () => {
    expect(validateBudgetRange(50, 100)).toEqual({ valid: true });
  });

  test('accepts when budgetMax === budgetMin', () => {
    expect(validateBudgetRange(75, 75)).toEqual({ valid: true });
  });
});
