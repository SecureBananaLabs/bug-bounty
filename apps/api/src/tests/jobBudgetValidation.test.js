import { validateJobBudgetRange } from '../controllers/jobBudgetValidation';

describe('Job Budget Range Validation', () => {
  it('should reject inverted budget ranges where budgetMax < budgetMin', () => {
    const result = validateJobBudgetRange(500, 100);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("budgetMax cannot be less than budgetMin");
  });

  it('should accept valid ordered budget ranges where budgetMax >= budgetMin', () => {
    const result = validateJobBudgetRange(100, 500);
    expect(result.valid).toBe(true);
  });
});
