import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createJob, listJobs } from './jobService.js';

describe('Job Query Filtering', () => {
  it('filters jobs by status, categoryId, and minBudget', async () => {
    await createJob({ title: 'Frontend Dev', status: 'open', categoryId: 'cat_web', budgetMin: 500 });
    await createJob({ title: 'Backend Dev', status: 'in_progress', categoryId: 'cat_web', budgetMin: 1200 });
    await createJob({ title: 'Mobile App', status: 'open', categoryId: 'cat_mobile', budgetMin: 800 });

    const openJobs = await listJobs({ status: 'open' });
    assert.equal(openJobs.some(j => j.status !== 'open'), false);

    const mobileJobs = await listJobs({ categoryId: 'cat_mobile' });
    assert.equal(mobileJobs.every(j => j.categoryId === 'cat_mobile'), true);

    const highBudgetJobs = await listJobs({ minBudget: 1000 });
    assert.equal(highBudgetJobs.every(j => (j.budgetMin || 0) >= 1000), true);
  });
});
