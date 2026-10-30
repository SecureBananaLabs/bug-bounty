import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listJobs, createJob } from '../services/jobService.js';

describe('jobService mutation isolation', () => {
  it('returns an independent array snapshot from listJobs that prevents caller mutation', async () => {
    await createJob({ title: 'Autonomous Developer', budget: 500 });
    const originalList = await listJobs();
    const originalCount = originalList.length;

    // Mutate the returned array
    originalList.pop();
    assert.equal(originalList.length, originalCount - 1);

    // Verify backing store remains unchanged
    const currentList = await listJobs();
    assert.equal(currentList.length, originalCount);
  });
});
