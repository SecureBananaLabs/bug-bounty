import { describe, it, expect, beforeEach } from 'vitest';
import * as jobService from '../services/jobService.js';

// Reset module state between tests
let originalJobs;
let originalCounter;

describe('jobService', () => {
  beforeEach(async () => {
    // Clear all jobs by creating them via list + splice
    const jobs = await jobService.listJobs();
    jobs.length = 0;
  });

  it('should create a job with server-generated id', async () => {
    const job = await jobService.createJob({ title: 'Test Job' });
    expect(job.id).toMatch(/^job_\d+_\d+$/);
    expect(job.title).toBe('Test Job');
    expect(job.status).toBe('open');
  });

  it('should not allow payload to override server-generated id', async () => {
    const job = await jobService.createJob({ id: 'hacked_id_123' });
    expect(job.id).not.toBe('hacked_id_123');
    expect(job.id).toMatch(/^job_\d+_\d+$/);
  });

  it('should not allow payload to override status', async () => {
    const job = await jobService.createJob({ status: 'completed' });
    expect(job.status).toBe('open');
  });

  it('should generate unique IDs even for same-millisecond creations', async () => {
    // Create multiple jobs rapidly
    const jobs = await Promise.all([
      jobService.createJob({}),
      jobService.createJob({}),
      jobService.createJob({}),
    ]);
    const ids = jobs.map(j => j.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('should list all created jobs', async () => {
    await jobService.createJob({ title: 'A' });
    await jobService.createJob({ title: 'B' });
    const jobs = await jobService.listJobs();
    expect(jobs.length).toBe(2);
  });
});
