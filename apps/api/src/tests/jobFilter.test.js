const { listJobs } = require('../services/jobService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mPrisma = {
    job: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

describe('jobService.listJobs filters', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  it('should call findMany with status filter', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);
    await listJobs({ status: 'open' });
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'open' }),
      })
    );
  });

  it('should call findMany with categoryId filter', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);
    await listJobs({ categoryId: 'cat-123' });
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: 'cat-123' }),
      })
    );
  });

  it('should call findMany with minBudget filter', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);
    await listJobs({ minBudget: 500 });
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ budget: { gte: 500 } }),
      })
    );
  });

  it('should call findMany with combined filters', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);
    await listJobs({ status: 'in_progress', categoryId: 'cat-123', minBudget: 1000 });
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'in_progress',
          categoryId: 'cat-123',
          budget: { gte: 1000 },
        }),
      })
    );
  });

  it('should call findMany with no filters when none provided', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);
    await listJobs({});
    expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      })
    );
  });
});