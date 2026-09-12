# Fix for Issue #2853: Job validation should reject inverted budget ranges

import { describe, it, expect } from 'vitest';
import { createJobSchema, updateJobSchema, patchJobSchema } from './job.schema';

describe('createJobSchema', () => {
  const validJob = {
    title: 'Software Engineer',
    description: 'Building great software',
    budgetMin: 100,
    budgetMax: 500,
    currency: 'USD',
    contactEmail: 'hiring@example.com',
  };

  it('should accept valid job with correct budget range', () => {
    const result = createJobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it('should accept job where budgetMin equals budgetMax', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: 500,
      budgetMax: 500,
    });
    expect(result.success).toBe(true);
  });

  it('should reject job with inverted budget range (budgetMax < budgetMin)', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: 500,
      budgetMax: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Budget maximum must be greater than or equal to budget minimum'
      );
      expect(result.error.issues[0].path).toContain('budgetMax');
    }
  });

  it('should reject job with zero budgetMax and positive budgetMin', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: 100,
      budgetMax: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should accept job with zero budgetMin and positive budgetMax', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: 0,
      budgetMax: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should accept job with both budgets at zero', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: 0,
      budgetMax: 0,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative budget values', () => {
    const result = createJobSchema.safeParse({
      ...validJob,
      budgetMin: -100,
      budgetMax: 500,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateJobSchema', () => {
  it('should accept update with valid budget range', () => {
    const result = updateJobSchema.safeParse({
      budgetMin: 200,
      budgetMax: 800,
    });
    expect(result.success).toBe(true);
  });

  it('should reject update with inverted budget range', () => {
    const result = updateJobSchema.safeParse({
      budgetMin: 800,
      budgetMax: 200,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Budget maximum must be greater than or equal to budget minimum'
      );
    }
  });

  it('should accept update with only budgetMin (no cross-field validation needed)', () => {
    const result = updateJobSchema.safeParse({
      budgetMin: 500,
    });
    expect(result.success).toBe(true);
  });

  it('should accept update with only budgetMax (no cross-field validation needed)', () => {
    const result = updateJobSchema.safeParse({
      budgetMax: 500,
    });
    expect(result.success).toBe(true);
  });

  it('should accept update with no budget fields', () => {
    const result = updateJobSchema.safeParse({
      title: 'Updated Title',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty update object', () => {
    const result = updateJobSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('patchJobSchema', () => {
  it('should reject patch with inverted budget range', () => {
    const result = patchJobSchema.safeParse({
      budgetMin: 1000,
      budgetMax: 100,
    });
    expect(result.success).toBe(false);
  });

  it('should accept patch with valid budget range', () => {
    const result = patchJobSchema.safeParse({
      budgetMin: 100,
      budgetMax: 1000,
    });
    expect(result.success).toBe(true);
  });

  it('should accept patch with single budget field', () => {
    const result = patchJobSchema.safeParse({
      budgetMax: 1000,
    });
    expect(result.success).toBe(true);
  });
});