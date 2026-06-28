# Fix for Issue #2853: Job validation should reject inverted budget ranges

import { describe, it, expect } from 'vitest';
import { createJobSchema, updateJobSchema, patchJobSchema } from './job.schema';

describe('createJobSchema', () => {
  const validJobPayload = {
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer.',
    budgetMin: 100,
    budgetMax: 500,
    currency: 'USD',
    category: 'Engineering',
    tags: ['javascript', 'typescript'],
  };

  it('should accept valid job with correct budget range', () => {
    const result = createJobSchema.safeParse(validJobPayload);
    expect(result.success).toBe(true);
  });

  it('should accept job where budgetMin equals budgetMax', () => {
    const payload = { ...validJobPayload, budgetMin: 500, budgetMax: 500 };
    const result = createJobSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject job with inverted budget range (budgetMax < budgetMin)', () => {
    const payload = { ...validJobPayload, budgetMin: 500, budgetMax: 100 };
    const result = createJobSchema.safeParse(payload);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      const budgetMaxError = result.error.issues.find(
        (issue) => issue.path.includes('budgetMax')
      );
      expect(budgetMaxError).toBeDefined();
      expect(budgetMaxError?.message).toBe(
        'Budget maximum must be greater than or equal to budget minimum'
      );
    }
  });

  it('should reject negative budget values', () => {
    const payload = { ...validJobPayload, budgetMin: -100, budgetMax: 500 };
    const result = createJobSchema.safeParse(payload);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('budgetMin'))).toBe(true);
    }
  });

  it('should reject missing required fields', () => {
    const payload = { title: 'Test Job' };
    const result = createJobSchema.safeParse(payload);
    
    expect(result.success).toBe(false);
  });
});

describe('updateJobSchema', () => {
  it('should accept partial update with valid budget range', () => {
    const payload = { budgetMin: 100, budgetMax: 500 };
    const result = updateJobSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject partial update with inverted budget range', () => {
    const payload = { budgetMin: 500, budgetMax: 100 };
    const result = updateJobSchema.safeParse(payload);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      const budgetMaxError = result.error.issues.find(
        (issue) => issue.path.includes('budgetMax')
      );
      expect(budgetMaxError).toBeDefined();
      expect(budgetMaxError?.message).toBe(
        'Budget maximum must be greater than or equal to budget minimum'
      );
    }
  });

  it('should accept update with only budgetMin (no cross-field validation needed)', () => {
    const payload = { budgetMin: 500 };
    const result = updateJobSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept update with only budgetMax (no cross-field validation needed)', () => {
    const payload = { budgetMax: 100 };
    const result = updateJobSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should accept update with non-budget fields only', () => {
    const payload = { title: 'Updated Title', description: 'Updated description' };
    const result = updateJobSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

describe('patchJobSchema', () => {
  it('should accept patch with valid budget range when both fields present', () => {
    const payload = { budgetMin: 200, budgetMax: 800 };
    const result = patchJobSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject patch with inverted budget range', () => {
    const payload = { budgetMin: 800, budgetMax: 200 };
    const result = patchJobSchema.safeParse(payload);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path.includes('budgetMax') &&
            issue.message.includes('greater than or equal')
        )
      ).toBe(true);
    }
  });

  it('should accept empty patch payload', () => {
    const result = patchJobSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});