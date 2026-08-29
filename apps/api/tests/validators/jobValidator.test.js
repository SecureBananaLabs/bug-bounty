const { createJobSchema, updateJobSchema } = require('../../src/validators/jobValidator');

describe('Job Validators', () => {
  describe('createJobSchema', () => {
    const validJob = {
      title: 'Test Job',
      description: 'A valid job description with enough characters',
      budgetMin: 100,
      budgetMax: 500,
      currency: 'USD',
      category: 'Development',
      skills: ['Node.js', 'React'],
      deadline: '2025-12-31T23:59:59Z',
      status: 'open'
    };

    it('should accept valid job with budgetMin < budgetMax', () => {
      const { error, value } = createJobSchema.validate(validJob);
      expect(error).toBeUndefined();
      expect(value.budgetMin).toBe(100);
      expect(value.budgetMax).toBe(500);
    });

    it('should reject job with budgetMin equal to budgetMax', () => {
      const invalidJob = { ...validJob, budgetMin: 500, budgetMax: 500 };
      const { error } = createJobSchema.validate(invalidJob);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('budgetMax must be greater than budgetMin');
    });

    it('should reject job with budgetMin greater than budgetMax', () => {
      const invalidJob = { ...validJob, budgetMin: 600, budgetMax: 200 };
      const { error } = createJobSchema.validate(invalidJob);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('budgetMax must be greater than budgetMin');
    });

    it('should reject job with negative budget values', () => {
      const invalidJob = { ...validJob, budgetMin: -100, budgetMax: 500 };
      const { error } = createJobSchema.validate(invalidJob);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('positive');
    });

    it('should reject job with missing budget fields', () => {
      const invalidJob = { ...validJob };
      delete invalidJob.budgetMin;
      const { error } = createJobSchema.validate(invalidJob);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('required');
    });
  });

  describe('updateJobSchema', () => {
    it('should accept update with only budgetMin', () => {
      const { error } = updateJobSchema.validate({ budgetMin: 200 });
      expect(error).toBeUndefined();
    });

    it('should accept update with only budgetMax', () => {
      const { error } = updateJobSchema.validate({ budgetMax: 800 });
      expect(error).toBeUndefined();
    });

    it('should accept update with valid budget range', () => {
      const { error } = updateJobSchema.validate({ budgetMin: 100, budgetMax: 500 });
      expect(error).toBeUndefined();
    });

    it('should reject update with inverted budget range', () => {
      const { error } = updateJobSchema.validate({ budgetMin: 500, budgetMax: 100 });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('budgetMax must be greater than budgetMin');
    });

    it('should reject update with equal budget values', () => {
      const { error } = updateJobSchema.validate({ budgetMin: 300, budgetMax: 300 });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('budgetMax must be greater than budgetMin');
    });

    it('should accept update with no budget fields', () => {
      const { error } = updateJobSchema.validate({ title: 'New Title' });
      expect(error).toBeUndefined();
    });
  });
});
