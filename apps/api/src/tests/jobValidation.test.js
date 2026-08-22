/**
 * @file jobValidation.test.js
 * Unit tests for job creation schema enforcing categoryId bounds and skills array limits.
 */

import assert from 'assert';
import {
  createJobSchema,
  validateCreateJob,
} from '../validators/job.js';

function runTests() {
  console.log('Running job validation unit tests...');

  // Test 1: Valid job payload
  {
    const validPayload = {
      title: 'Senior Fullstack Engineer',
      description: 'We are seeking a senior fullstack engineer with React and Node.js expertise.',
      budgetMin: 3000,
      budgetMax: 5000,
      categoryId: 'cat_web_development',
      skills: ['react', 'node.js', 'typescript', 'postgresql'],
    };

    const res = validateCreateJob(validPayload);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.title, validPayload.title);
    assert.strictEqual(res.data.skills.length, 4);
    console.log('✔ Test 1 passed: Valid job creation accepted');
  }

  // Test 2: categoryId exceeds 50 characters or is empty
  {
    const longCategoryPayload = {
      title: 'Valid Title Here',
      description: 'Valid description with sufficient characters.',
      budgetMin: 100,
      budgetMax: 200,
      categoryId: 'c'.repeat(51),
      skills: ['javascript'],
    };

    const res1 = validateCreateJob(longCategoryPayload);
    assert.strictEqual(res1.success, false);
    assert.ok(res1.errors.some((e) => e.includes('50 characters')));

    const emptyCategoryPayload = { ...longCategoryPayload, categoryId: '' };
    const res2 = validateCreateJob(emptyCategoryPayload);
    assert.strictEqual(res2.success, false);
    console.log('✔ Test 2 passed: categoryId bounds (1-50 chars) enforced');
  }

  // Test 3: skills array exceeds 20 items or individual skill exceeds 30 characters
  {
    const tooManySkillsPayload = {
      title: 'Valid Title Here',
      description: 'Valid description with sufficient characters.',
      budgetMin: 100,
      budgetMax: 200,
      categoryId: 'dev',
      skills: Array.from({ length: 21 }, (_, i) => `skill_${i}`),
    };

    const res1 = validateCreateJob(tooManySkillsPayload);
    assert.strictEqual(res1.success, false);
    assert.ok(res1.errors.some((e) => e.includes('20 skills')));

    const longSkillPayload = {
      title: 'Valid Title Here',
      description: 'Valid description with sufficient characters.',
      budgetMin: 100,
      budgetMax: 200,
      categoryId: 'dev',
      skills: ['s'.repeat(31)],
    };

    const res2 = validateCreateJob(longSkillPayload);
    assert.strictEqual(res2.success, false);
    assert.ok(res2.errors.some((e) => e.includes('30 characters')));
    console.log('✔ Test 3 passed: skills array limits (max 20 items, max 30 chars/skill) enforced');
  }

  // Test 4: Default skills array to empty array if omitted
  {
    const omittedSkillsPayload = {
      title: 'Valid Title Here',
      description: 'Valid description with sufficient characters.',
      budgetMin: 100,
      budgetMax: 200,
      categoryId: 'design',
    };

    const res = validateCreateJob(omittedSkillsPayload);
    assert.strictEqual(res.success, true);
    assert.deepStrictEqual(res.data.skills, []);
    console.log('✔ Test 4 passed: Default skills array empty when omitted');
  }

  console.log('All job validation tests passed successfully!');
}

runTests();
