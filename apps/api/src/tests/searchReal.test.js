import { describe, it, expect } from 'vitest';
import { globalSearch } from '../services/searchService.js';
import { createJob } from '../services/jobService.js';
import { createUser } from '../services/userService.js';

describe('searchService: actual in-memory search (#13168)', () => {
  it('should find jobs by title', async () => {
    await createJob({ title: 'React Frontend Developer', budget: 5000 });
    await createJob({ title: 'Python Data Scientist', budget: 6000 });

    const result = await globalSearch('react');
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].title).toContain('React');
  });

  it('should find jobs by description', async () => {
    await createJob({ title: 'Full Stack', description: 'Looking for React and Node.js experience' });

    const result = await globalSearch('node.js');
    expect(result.jobs).toHaveLength(1);
  });

  it('should return empty for non-matching query', async () => {
    const result = await globalSearch('nonexistent_query_xyz');
    expect(result.jobs).toHaveLength(0);
    expect(result.users).toHaveLength(0);
  });

  it('should return empty for blank query', async () => {
    const result = await globalSearch('');
    expect(result.jobs).toHaveLength(0);
    expect(result.users).toHaveLength(0);
    expect(result.freelancers).toHaveLength(0);
  });

  it('should filter freelancers correctly', async () => {
    await createUser({ email: 'freelancer@test.com', role: 'freelancer' });
    await createUser({ email: 'client@test.com', role: 'client' });

    const result = await globalSearch('test.com');
    expect(result.users).toHaveLength(2);
    expect(result.freelancers).toHaveLength(1);
    expect(result.freelancers[0].role).toBe('freelancer');
  });
});
