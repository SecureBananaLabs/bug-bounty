import { describe, it, expect } from 'vitest';
import { createJobSchema, updateJobSchema } from '../validators/job.js';

describe('job validators: budget + skills (#13183, #13283)', () => {
  describe('budget range validation (#13183)', () => {
    it('should accept valid ordered budget', () => {
      const r = createJobSchema.safeParse({ title: 'Test Job', description: 'A test job description', budgetMin: 100, budgetMax: 500, categoryId: 'cat1' });
      expect(r.success).toBe(true);
    });

    it('should reject inverted budget (min > max)', () => {
      const r = createJobSchema.safeParse({ title: 'Test Job', description: 'A test job description', budgetMin: 500, budgetMax: 100, categoryId: 'cat1' });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some(i => i.message.includes('budgetMax'))).toBe(true);
      }
    });

    it('should accept equal min and max', () => {
      const r = createJobSchema.safeParse({ title: 'Test Job', description: 'A test job description', budgetMin: 300, budgetMax: 300, categoryId: 'cat1' });
      expect(r.success).toBe(true);
    });
  });

  describe('skills array validation (#13283)', () => {
    it('should accept valid skills', () => {
      const r = createJobSchema.safeParse({ title: 'Test', description: 'A test job description here', budgetMin: 10, budgetMax: 50, categoryId: 'c1', skills: ['react', 'nodejs'] });
      expect(r.success).toBe(true);
    });

    it('should reject whitespace-only skill names', () => {
      const r = createJobSchema.safeParse({ title: 'Test', description: 'A test job description here', budgetMin: 10, budgetMax: 50, categoryId: 'c1', skills: ['  ', 'react'] });
      expect(r.success).toBe(false);
    });

    it('should reject more than 50 skills', () => {
      const r = createJobSchema.safeParse({
        title: 'Test', description: 'A test job description here',
        budgetMin: 10, budgetMax: 50, categoryId: 'c1',
        skills: Array(51).fill('skill'),
      });
      expect(r.success).toBe(false);
    });

    it('should reject skill name longer than 64 chars', () => {
      const r = createJobSchema.safeParse({
        title: 'Test', description: 'A test job description here',
        budgetMin: 10, budgetMax: 50, categoryId: 'c1',
        skills: ['a'.repeat(65)],
      });
      expect(r.success).toBe(false);
    });

    it('should default to empty array', () => {
      const r = createJobSchema.safeParse({ title: 'Test', description: 'A test job description here', budgetMin: 10, budgetMax: 50, categoryId: 'c1' });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.skills).toEqual([]);
      }
    });
  });
});
