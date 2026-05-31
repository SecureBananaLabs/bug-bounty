import { describe, it, expect } from 'vitest';
import { createJobSchema, updateJobSchema } from './job.js';

describe('Job Validation', () => {
  describe('createJobSchema', () => {
    it('should accept valid budget range', () => {
      const result = createJobSchema.safeParse({
        title: 'Test Job',
        description: 'Test description for job',
        budgetMin: 100,
        budgetMax: 500,
        categoryId: 'cat1',
        skills: ['javascript']
      });
      expect(result.success).toBe(true);
    });

    it('should reject inverted budget range', () => {
      const result = createJobSchema.safeParse({
        title: 'Test Job',
        description: 'Test description for job',
        budgetMin: 500,
        budgetMax: 100,
        categoryId: 'cat1',
        skills: ['javascript']
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('budgetMax');
      }
    });

    it('should accept equal budget values', () => {
      const result = createJobSchema.safeParse({
        title: 'Test Job',
        description: 'Test description for job',
        budgetMin: 300,
        budgetMax: 300,
        categoryId: 'cat1',
        skills: ['javascript']
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateJobSchema', () => {
    it('should accept partial update with valid range', () => {
      const result = updateJobSchema.safeParse({
        budgetMin: 100,
        budgetMax: 500
      });
      expect(result.success).toBe(true);
    });

    it('should reject partial update with inverted range', () => {
      const result = updateJobSchema.safeParse({
        budgetMin: 500,
        budgetMax: 100
      });
      expect(result.success).toBe(false);
    });

    it('should accept update with only one budget field', () => {
      const result = updateJobSchema.safeParse({
        budgetMin: 500
      });
      expect(result.success).toBe(true);
    });
  });
});
