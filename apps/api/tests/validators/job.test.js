const { createJobSchema, updateJobSchema } = require('../../src/validators/job');

describe('createJobSchema', () => {
  it('should accept valid budget range where budgetMin <= budgetMax', () => {
    const validData = {
      title: 'Test Job',
      description: 'A test job description',
      budgetMin: 50,
      budgetMax: 100,
      category: 'Engineering',
    };
    const result = createJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept equal budgetMin and budgetMax', () => {
    const validData = {
      title: 'Test Job',
      description: 'A test job description',
      budgetMin: 100,
      budgetMax: 100,
      category: 'Engineering',
    };
    const result = createJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject inverted budget range where budgetMin > budgetMax', () => {
    const invalidData = {
      title: 'Test Job',
      description: 'A test job description',
      budgetMin: 100,
      budgetMax: 50,
      category: 'Engineering',
    };
    const result = createJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('budgetMin must be less than or equal to budgetMax');
    }
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      budgetMin: 10,
      budgetMax: 20,
    };
    const result = createJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('updateJobSchema', () => {
  it('should accept valid update with only budgetMin', () => {
    const validData = {
      budgetMin: 50,
    };
    const result = updateJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept valid update with only budgetMax', () => {
    const validData = {
      budgetMax: 200,
    };
    const result = updateJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should accept valid update with both budgets in correct order', () => {
    const validData = {
      budgetMin: 50,
      budgetMax: 100,
    };
    const result = updateJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject inverted budget range in update', () => {
    const invalidData = {
      budgetMin: 200,
      budgetMax: 100,
    };
    const result = updateJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('budgetMin must be less than or equal to budgetMax');
    }
  });

  it('should accept update without any budget fields', () => {
    const validData = {
      title: 'Updated Title',
    };
    const result = updateJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
