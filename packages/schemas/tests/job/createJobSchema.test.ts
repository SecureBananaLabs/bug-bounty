import { createJobSchema } from '../../src/job/createJobSchema';

describe('createJobSchema', () => {
  it('should validate a valid job', () => {
    const validJob = {
      title: 'Test Job',
      description: 'Test Description',
      budgetMin: 100,
      budgetMax: 200,
      categoryId: '1',
      skills: ['skill1'],
      duration: '1 week',
      experienceLevel: 'beginner',
    };
    expect(createJobSchema.parse(validJob)).toEqual(validJob);
  });

  it('should reject inverted budget ranges', () => {
    const invalidJob = {
      title: 'Test Job',
      description: 'Test Description',
      budgetMin: 200,
      budgetMax: 100,
      categoryId: '1',
      skills: ['skill1'],
      duration: '1 week',
      experienceLevel: 'beginner',
    };
    expect(() => createJobSchema.parse(invalidJob)).toThrow();
  });
});