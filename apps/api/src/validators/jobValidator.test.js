const { createJobSchema, updateJobSchema } = require('./jobValidator');

describe('createJobSchema', () => {
  const validJob = {
    title: 'Fix login bug',
    description: 'We need a developer to fix the login issue.',
    budgetMin: 100,
    budgetMax: 500,
    category: 'Development',
  };

  it('should accept valid job with positive budgets', () => {
    const result = createJobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it('should accept valid job with zero budgets', () => {
    const job = { ...validJob, budgetMin: 0, budgetMax: 0 };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(true);
  });

  it('should reject Infinity for budgetMin', () => {
    const job = { ...validJob, budgetMin: Infinity };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('finite');
    }
  });

  it('should reject Infinity for budgetMax', () => {
    const job = { ...validJob, budgetMax: Infinity };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('finite');
    }
  });

  it('should reject -Infinity for budgetMin', () => {
    const job = { ...validJob, budgetMin: -Infinity };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
  });

  it('should reject NaN for budgetMax', () => {
    const job = { ...validJob, budgetMax: NaN };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
  });

  it('should reject negative numbers for budgetMin', () => {
    const job = { ...validJob, budgetMin: -10 };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
  });

  it('should reject non-number budgetMin', () => {
    const job = { ...validJob, budgetMin: 'abc' };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
  });

  it('should reject missing budget fields', () => {
    const job = { title: 'Test', description: 'Test', category: 'Dev' };
    const result = createJobSchema.safeParse(job);
    expect(result.success).toBe(false);
  });
});

describe('updateJobSchema', () => {
  it('should accept partial update with valid budgetMin', () => {
    const result = updateJobSchema.safeParse({ budgetMin: 50 });
    expect(result.success).toBe(true);
  });

  it('should reject Infinity in update', () => {
    const result = updateJobSchema.safeParse({ budgetMax: Infinity });
    expect(result.success).toBe(false);
  });

  it('should accept empty object', () => {
    const result = updateJobSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
