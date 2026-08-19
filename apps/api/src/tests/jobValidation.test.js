import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createJobSchema } from '../validators/job.js';

describe('Job Creation Validation Bounds', () => {
  it('accepts valid job payload with bounded categoryId and skills', () => {
    const valid = {
      title: 'Full Stack Engineer',
      description: 'Looking for a senior full stack engineer to build features',
      budgetMin: 1000,
      budgetMax: 2000,
      categoryId: 'engineering',
      skills: ['react', 'node', 'typescript']
    };

    const parsed = createJobSchema.parse(valid);
    assert.equal(parsed.categoryId, 'engineering');
    assert.equal(parsed.skills.length, 3);
  });

  it('rejects categoryId exceeding 50 characters', () => {
    const invalid = {
      title: 'Full Stack Engineer',
      description: 'Looking for a senior full stack engineer to build features',
      budgetMin: 1000,
      budgetMax: 2000,
      categoryId: 'c'.repeat(51),
      skills: ['react']
    };

    assert.throws(() => createJobSchema.parse(invalid));
  });

  it('rejects skills array exceeding 20 items', () => {
    const invalid = {
      title: 'Full Stack Engineer',
      description: 'Looking for a senior full stack engineer to build features',
      budgetMin: 1000,
      budgetMax: 2000,
      categoryId: 'engineering',
      skills: Array.from({ length: 21 }, (_, i) => `skill_${i}`)
    };

    assert.throws(() => createJobSchema.parse(invalid));
  });

  it('rejects individual skill item exceeding 30 characters', () => {
    const invalid = {
      title: 'Full Stack Engineer',
      description: 'Looking for a senior full stack engineer to build features',
      budgetMin: 1000,
      budgetMax: 2000,
      categoryId: 'engineering',
      skills: ['s'.repeat(31)]
    };

    assert.throws(() => createJobSchema.parse(invalid));
  });
});
