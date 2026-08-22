/**
 * @file jobFilter.test.js
 * Unit tests for listJobs query filtering (status, categoryId, minBudget).
 */

import assert from 'assert';
import {
  createJob,
  listJobs,
  _resetJobsForTesting,
} from '../services/jobService.js';

async function runTests() {
  console.log('Running job filter unit tests...');

  _resetJobsForTesting();

  // Populate mock jobs
  await createJob({
    title: 'Frontend React App',
    status: 'open',
    categoryId: 'web_dev',
    budgetMin: 1000,
    budgetMax: 2500,
  });

  await createJob({
    title: 'Backend API in Go',
    status: 'in_progress',
    categoryId: 'backend_dev',
    budgetMin: 3000,
    budgetMax: 5000,
  });

  await createJob({
    title: 'Logo and Brand Design',
    status: 'completed',
    categoryId: 'design',
    budgetMin: 300,
    budgetMax: 600,
  });

  await createJob({
    title: 'Vue.js Dashboard',
    status: 'open',
    categoryId: 'web_dev',
    budgetMin: 800,
    budgetMax: 1200,
  });

  // Test 1: Unfiltered query returns all items
  {
    const all = await listJobs();
    assert.strictEqual(all.length, 4);
    console.log('✔ Test 1 passed: Unfiltered list returns all jobs');
  }

  // Test 2: Filter by status
  {
    const openJobs = await listJobs({ status: 'open' });
    assert.strictEqual(openJobs.length, 2);
    assert.ok(openJobs.every((j) => j.status === 'open'));

    const inProgressJobs = await listJobs({ status: 'in_progress' });
    assert.strictEqual(inProgressJobs.length, 1);
    assert.strictEqual(inProgressJobs[0].title, 'Backend API in Go');
    console.log('✔ Test 2 passed: Filtering by status');
  }

  // Test 3: Filter by categoryId
  {
    const webJobs = await listJobs({ categoryId: 'web_dev' });
    assert.strictEqual(webJobs.length, 2);
    assert.ok(webJobs.every((j) => j.categoryId === 'web_dev'));

    const designJobs = await listJobs({ categoryId: 'design' });
    assert.strictEqual(designJobs.length, 1);
    assert.strictEqual(designJobs[0].title, 'Logo and Brand Design');
    console.log('✔ Test 3 passed: Filtering by categoryId');
  }

  // Test 4: Filter by minBudget
  {
    const highBudgetJobs = await listJobs({ minBudget: 2000 });
    assert.strictEqual(highBudgetJobs.length, 2); // 2500 and 5000 budgetMax

    const extremeBudgetJobs = await listJobs({ minBudget: 10000 });
    assert.strictEqual(extremeBudgetJobs.length, 0);
    console.log('✔ Test 4 passed: Filtering by minBudget');
  }

  // Test 5: Combined multi-criteria filtering
  {
    const filtered = await listJobs({
      status: 'open',
      categoryId: 'web_dev',
      minBudget: 2000,
    });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].title, 'Frontend React App');
    console.log('✔ Test 5 passed: Multi-criteria combined filtering');
  }

  console.log('All job filter tests passed successfully!');
}

runTests();
