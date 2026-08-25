import { describe, it, expect } from 'vitest';
import { createJobSchema, updateJobSchema, jobQuerySchema } from '../validators/job.js';

describe('Job Validation Schemas', () => {
  describe('createJobSchema', () => {
    it('should validate a valid job creation payload', () => {
      const payload = {
        title: 'Build a React App',
        description: 'We need a React developer...',
        categoryId: 'cat_123',
        skills: ['React', 'TypeScript', 'Tailwind'],
        budgetMin: 1000,
        budgetMax: 5000,
        durationWeeks: 4,
        experienceLevel: 'INTERMEDIATE',
        remoteType: 'REMOTE',
        location: 'San Francisco, CA',
      };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const payload = { title: '', description: 'desc', categoryId: 'cat_1' };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject title longer than 200 chars', () => {
      const payload = { title: 'a'.repeat(201), description: 'desc', categoryId: 'cat_1' };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const payload = { title: 'title', description: '', categoryId: 'cat_1' };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject description longer than 10000 chars', () => {
      const payload = { title: 'title', description: 'a'.repeat(10001), categoryId: 'cat_1' };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject empty categoryId', () => {
      const payload = { title: 'title', description: 'desc', categoryId: '' };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject categoryId longer than 50 chars', () => {
      const payload = { title: 'title', description: 'desc', categoryId: 'a'.repeat(51) };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept categoryId with exactly 50 chars', () => {
      const payload = { title: 'title', description: 'desc', categoryId: 'a'.repeat(50) };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject skills array with more than 20 items', () => {
      const payload = {
        title: 'title',
        description: 'desc',
        categoryId: 'cat_1',
        skills: Array.from({ length: 21 }, (_, i) => `skill${i}`),
      };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept skills array with exactly 20 items', () => {
      const payload = {
        title: 'title',
        description: 'desc',
        categoryId: 'cat_1',
        skills: Array.from({ length: 20 }, (_, i) => `skill${i}`),
      };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject skill longer than 30 chars', () => {
      const payload = {
        title: 'title',
        description: 'desc',
        categoryId: 'cat_1',
        skills: ['a'.repeat(31)],
      };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept skill with exactly 30 chars', () => {
      const payload = {
        title: 'title',
        description: 'desc',
        categoryId: 'cat_1',
        skills: ['a'.repeat(30)],
      };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject empty skill string', () => {
      const payload = {
        title: 'title',
        description: 'desc',
        categoryId: 'cat_1',
        skills: [''],
      };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept optional skills field', () => {
      const payload = { title: 'title', description: 'desc', categoryId: 'cat_1' };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject negative budgetMin', () => {
      const payload = { title: 'title', description: 'desc', categoryId: 'cat_1', budgetMin: -100 };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject budgetMax exceeding 52 weeks', () => {
      const payload = { title: 'title', description: 'desc', categoryId: 'cat_1', durationWeeks: 53 };
      const result = createJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('updateJobSchema', () => {
    it('should validate a valid partial update payload', () => {
      const payload = { title: 'Updated Title' };
      const result = updateJobSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject categoryId longer than 50 chars on update', () => {
      const payload = { categoryId: 'a'.repeat(51) };
      const result = updateJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject skills array with more than 20 items on update', () => {
      const payload = { skills: Array.from({ length: 21 }, (_, i) => `skill${i}`) };
      const result = updateJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject skill longer than 30 chars on update', () => {
      const payload = { skills: ['a'.repeat(31)] };
      const result = updateJobSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('jobQuerySchema', () => {
    it('should validate default query params', () => {
      const result = jobQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortOrder).toBe('desc');
    });

    it('should reject categoryId longer than 50 chars in query', () => {
      const result = jobQuerySchema.safeParse({ categoryId: 'a'.repeat(51) });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = jobQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});