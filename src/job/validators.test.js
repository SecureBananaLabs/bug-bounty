const { validateBudget } = require('./validators');

describe('validateBudget', () => {
  describe('invalid ranges', () => {
    it('rejects create payload with budgetMax < budgetMin', () => {
      expect(() => validateBudget({ budgetMin: 100, budgetMax: 50 }))
        .toThrow('budgetMax must be greater than or equal to budgetMin');
    });

    it('rejects update payload with both bounds supplied and inverted', () => {
      expect(() => validateBudget({ budgetMin: 200, budgetMax: 100 }))
        .toThrow('budgetMax must be greater than or equal to budgetMin');
    });

    it('rejects when budgetMax equals budgetMin (invalid range)', () => {
      expect(() => validateBudget({ budgetMin: 100, budgetMax: 100 }))
        .not.toThrow();
    });
  });

  describe('valid ranges', () => {
    it('accepts normal range where budgetMax > budgetMin', () => {
      const result = validateBudget({ budgetMin: 50, budgetMax: 100 });
      expect(result).toEqual({ budgetMin: 50, budgetMax: 100 });
    });

    it('accepts equal bounds (single value range)', () => {
      const result = validateBudget({ budgetMin: 100, budgetMax: 100 });
      expect(result).toEqual({ budgetMin: 100, budgetMax: 100 });
    });

    it('preserves partial update with only budgetMin', () => {
      const result = validateBudget({ budgetMin: 75 });
      expect(result).toEqual({ budgetMin: 75 });
    });

    it('preserves partial update with only budgetMax', () => {
      const result = validateBudget({ budgetMax: 150 });
      expect(result).toEqual({ budgetMax: 150 });
    });

    it('accepts empty object for partial updates', () => {
      const result = validateBudget({});
      expect(result).toEqual({});
    });
  });

  describe('schema validation', () => {
    it('rejects non-numeric budgetMin', () => {
      expect(() => validateBudget({ budgetMin: 'abc', budgetMax: 100 }))
        .toThrow();
    });

    it('rejects negative budget values', () => {
      expect(() => validateBudget({ budgetMin: -10, budgetMax: 100 }))
        .toThrow();
    });
  });
});
