import { createJobSchema, updateJobSchema } from '../../schemas/jobSchema';

describe('Job Schema Validation', () => {
  describe('createJobSchema', () => {
    it('should reject inverted budget ranges', () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Test Description',
        budgetMin: 100,
        budgetMax: 50,
      };

      expect(() => createJobSchema.parse(invalidJob)).toThrow();
    });

    it('should accept valid budget ranges', () => {
      const validJob = {
        title: 'Test Job',
        description: 'Test Description',
        budgetMin: 50,
        budgetMax: 100,
      };

      expect(() => createJobSchema.parse(validJob)).not.toThrow();
    });
  });

  describe('updateJobSchema', () => {
    it('should reject inverted budget ranges when both fields are provided', () => {
      const invalidUpdate = {
        budgetMin: 100,
        budgetMax: 50,
      };

      expect(() => updateJobSchema.parse(invalidUpdate)).toThrow();
    });

    it('should accept partial updates without budget validation', () => {
      const partialUpdate = {
        title: 'Updated Title',
      };

      expect(() => updateJobSchema.parse(partialUpdate)).not.toThrow();
    });

    it('should accept valid budget ranges when both fields are provided', () => {
      const validUpdate = {
        budgetMin: 50,
        budgetMax: 100,
      };

      expect(() => updateJobSchema.parse(validUpdate)).not.toThrow();
    });
  });
});