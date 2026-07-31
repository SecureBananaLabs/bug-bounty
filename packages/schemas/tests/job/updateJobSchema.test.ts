import { updateJobSchema } from '../../src/job/updateJobSchema';

describe('updateJobSchema', () => {
  it('should validate a valid job update', () => {
    const validUpdate = {
      title: 'Updated Job',
      budgetMin: 100,
      budgetMax: 200,
    };
    expect(updateJobSchema.parse(validUpdate)).toEqual(validUpdate);
  });

  it('should reject inverted budget ranges when both fields are present', () => {
    const invalidUpdate = {
      budgetMin: 200,
      budgetMax: 100,
    };
    expect(() => updateJobSchema.parse(invalidUpdate)).toThrow();
  });

  it('should allow partial updates without budget fields', () => {
    const partialUpdate = {
      title: 'Updated Job',
    };
    expect(updateJobSchema.parse(partialUpdate)).toEqual(partialUpdate);
  });
});