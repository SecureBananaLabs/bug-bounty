import { describe, it, expect } from 'vitest';
import { createJob, listJobs, updateJobStatus } from '../services/jobService.js';

describe('jobService: lifecycle status update (#12751)', () => {
  it('should create job with DRAFT status', async () => {
    const job = await createJob({ title: 'Test Job' });
    expect(job.status).toBe('DRAFT');
  });

  it('should update job status through lifecycle', async () => {
    const job = await createJob({ title: 'Lifecycle Test' });

    let updated = await updateJobStatus(job.id, 'OPEN');
    expect(updated.status).toBe('OPEN');

    updated = await updateJobStatus(job.id, 'IN_PROGRESS');
    expect(updated.status).toBe('IN_PROGRESS');

    updated = await updateJobStatus(job.id, 'COMPLETED');
    expect(updated.status).toBe('COMPLETED');
  });

  it('should reject invalid status', async () => {
    const job = await createJob({ title: 'Invalid Status Test' });
    await expect(updateJobStatus(job.id, 'INVALID')).rejects.toThrow('Invalid job status');
  });

  it('should throw for non-existent job', async () => {
    await expect(updateJobStatus('job_nonexistent', 'OPEN')).rejects.toThrow('Job not found');
  });

  it('should support CANCELLED status', async () => {
    const job = await createJob({ title: 'Cancel Test' });
    const updated = await updateJobStatus(job.id, 'CANCELLED');
    expect(updated.status).toBe('CANCELLED');
  });
});
