<content>
const { createJob, getJobs } = require('../src/services/jobService');

describe('createJob', () => {
  beforeEach(() => {
    // Reset the jobs array before each test
    const { jobs } = require('../src/services/jobService');
    jobs.length = 0;
  });

  test('should create a job with a generated id and "open" status', () => {
    const payload = {
      title: 'Test Job',
      description: 'This is a test job'
    };

    const job = createJob(payload);

    // Check that the job has the expected properties
    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('status', 'open');
    expect(job).toHaveProperty('createdAt');
    expect(job).toHaveProperty('updatedAt');
    expect(job.title).toBe('Test Job');
    expect(job.description).toBe('This is a test job');

    // Check that the job is in the jobs array
    const jobs = getJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toEqual(job);
  });

  test('should not allow payload to override the generated id', () => {
    const payload = {
      id: 'custom-id-123',
      title: 'Test Job with Custom ID'
    };

    const job = createJob(payload);

    // The job should have a different id than the one in the payload
    expect(job.id).not.toBe('custom-id-123');
    expect(job.title).toBe('Test Job with Custom ID');
  });

  test('should not allow payload to override the "open" status', () => {
    const payload = {
      status: 'closed',
      title: 'Test Job with Closed Status'
    };

    const job = createJob(payload);

    // The job should still have the "open" status
    expect(job.status).toBe('open');
    expect(job.title).toBe('Test Job with Closed Status');
  });

  test('should allow payload to override other fields', () => {
    const payload = {
      title: 'Custom Title',
      description: 'Custom Description',
      priority: 'high'
    };

    const job = createJob(payload);

    expect(job.title).toBe('Custom Title');
    expect(job.description).toBe('Custom Description');
    expect(job.priority).toBe('high');
  });
});
</content>