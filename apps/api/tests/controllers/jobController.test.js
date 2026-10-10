import { describe, it, expect, beforeEach, vi } from 'vitest';
import { postJob } from '../../src/controllers/jobController.js';
import * as jobService from '../../src/services/jobService.js';

vi.mock('../../src/services/jobService.js', () => ({
  createJob: vi.fn(),
}));

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('postJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 201 for a valid payload', async () => {
    const res = mockRes();
    const next = vi.fn();

    jobService.createJob.mockResolvedValue({ id: 1, title: 'Test Job' });

    await postJob(
      { body: { title: 'A valid job title with enough chars', description: 'A description that is long enough.', budget: 500, tags: ['js'] } },
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 with structured errors for a short title', async () => {
    const res = mockRes();
    const next = vi.fn();

    await postJob(
      { body: { title: 'Short', description: 'A description that is long enough.', budget: 500, tags: [] } },
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 with structured errors for a short description', async () => {
    const res = mockRes();
    const next = vi.fn();

    await postJob(
      { body: { title: 'A valid job title with enough chars', description: 'Short', budget: 500, tags: [] } },
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 with structured errors for a negative budget', async () => {
    const res = mockRes();
    const next = vi.fn();

    await postJob(
      { body: { title: 'A valid job title with enough chars', description: 'A description that is long enough.', budget: -100, tags: [] } },
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 with structured errors for missing fields', async () => {
    const res = mockRes();
    const next = vi.fn();

    await postJob(
      { body: {} },
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
