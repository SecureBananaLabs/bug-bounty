const ProposalService = require('../../src/services/proposalService');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockCreate = jest.fn();
  const mockFindUnique = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockFindMany = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      proposal: {
        create: mockCreate,
        findUnique: mockFindUnique,
        update: mockUpdate,
        delete: mockDelete,
        findMany: mockFindMany,
      },
    })),
  };
});

describe('ProposalService', () => {
  let prisma;
  
  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient();
  });

  describe('createProposal', () => {
    it('should create a proposal with server-generated createdAt timestamp', async () => {
      const inputData = {
        title: 'Test Proposal',
        description: 'A test proposal',
        jobId: 'job-123',
        freelancerId: 'user-456',
        rate: 100,
      };

      const expectedCreatedAt = expect.any(String);
      const mockProposal = {
        id: 'proposal-1',
        ...inputData,
        createdAt: new Date().toISOString(),
      };

      prisma.proposal.create.mockResolvedValue(mockProposal);

      const result = await ProposalService.createProposal(inputData);

      expect(prisma.proposal.create).toHaveBeenCalledTimes(1);
      expect(prisma.proposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Proposal',
          description: 'A test proposal',
          jobId: 'job-123',
          freelancerId: 'user-456',
          rate: 100,
          createdAt: expect.any(String),
        }),
      });
      expect(result).toEqual(mockProposal);
    });

    it('should ignore caller-supplied createdAt timestamp', async () => {
      const inputData = {
        title: 'Test Proposal',
        description: 'A test proposal',
        jobId: 'job-123',
        freelancerId: 'user-456',
        rate: 100,
        createdAt: '2020-01-01T00:00:00.000Z', // caller-supplied, should be ignored
      };

      const mockProposal = {
        id: 'proposal-1',
        title: 'Test Proposal',
        description: 'A test proposal',
        jobId: 'job-123',
        freelancerId: 'user-456',
        rate: 100,
        createdAt: new Date().toISOString(),
      };

      prisma.proposal.create.mockResolvedValue(mockProposal);

      const result = await ProposalService.createProposal(inputData);

      // Verify that the createdAt passed to Prisma is NOT the caller-supplied one
      const createCallArgs = prisma.proposal.create.mock.calls[0][0];
      expect(createCallArgs.data.createdAt).not.toBe('2020-01-01T00:00:00.000Z');
      expect(createCallArgs.data.createdAt).toEqual(expect.any(String));
      
      // Verify the returned proposal has a server-generated timestamp
      expect(result.createdAt).toBeDefined();
      expect(result.createdAt).toEqual(expect.any(String));
    });

    it('should return the created proposal with all fields', async () => {
      const inputData = {
        title: 'Complete Proposal',
        description: 'Full proposal data',
        jobId: 'job-789',
        freelancerId: 'user-abc',
        rate: 250,
        coverLetter: 'I am interested',
      };

      const mockProposal = {
        id: 'proposal-2',
        ...inputData,
        createdAt: new Date().toISOString(),
      };

      prisma.proposal.create.mockResolvedValue(mockProposal);

      const result = await ProposalService.createProposal(inputData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
      expect(result.title).toBe('Complete Proposal');
      expect(result.description).toBe('Full proposal data');
      expect(result.jobId).toBe('job-789');
      expect(result.freelancerId).toBe('user-abc');
      expect(result.rate).toBe(250);
      expect(result.coverLetter).toBe('I am interested');
    });
  });

  describe('updateProposal', () => {
    it('should ignore caller-supplied createdAt on update', async () => {
      const updateData = {
        rate: 150,
        createdAt: '2021-01-01T00:00:00.000Z', // should be ignored
      };

      const mockUpdatedProposal = {
        id: 'proposal-1',
        title: 'Test',
        rate: 150,
        createdAt: '2023-06-01T12:00:00.000Z', // original timestamp preserved
      };

      prisma.proposal.update.mockResolvedValue(mockUpdatedProposal);

      const result = await ProposalService.updateProposal('proposal-1', updateData);

      const updateCallArgs = prisma.proposal.update.mock.calls[0][0];
      expect(updateCallArgs.data).not.toHaveProperty('createdAt');
      expect(updateCallArgs.data.rate).toBe(150);
      expect(result).toEqual(mockUpdatedProposal);
    });
  });

  describe('getProposalById', () => {
    it('should return proposal by id', async () => {
      const mockProposal = { id: 'proposal-1', title: 'Test' };
      prisma.proposal.findUnique.mockResolvedValue(mockProposal);

      const result = await ProposalService.getProposalById('proposal-1');
      expect(result).toEqual(mockProposal);
      expect(prisma.proposal.findUnique).toHaveBeenCalledWith({ where: { id: 'proposal-1' } });
    });
  });

  describe('deleteProposal', () => {
    it('should delete proposal by id', async () => {
      const mockDeleted = { id: 'proposal-1' };
      prisma.proposal.delete.mockResolvedValue(mockDeleted);

      const result = await ProposalService.deleteProposal('proposal-1');
      expect(result).toEqual(mockDeleted);
      expect(prisma.proposal.delete).toHaveBeenCalledWith({ where: { id: 'proposal-1' } });
    });
  });

  describe('listProposals', () => {
    it('should return proposals with filters', async () => {
      const mockProposals = [
        { id: '1', title: 'Proposal 1' },
        { id: '2', title: 'Proposal 2' },
      ];
      prisma.proposal.findMany.mockResolvedValue(mockProposals);

      const result = await ProposalService.listProposals({ jobId: 'job-123' });
      expect(result).toEqual(mockProposals);
      expect(prisma.proposal.findMany).toHaveBeenCalledWith({ where: { jobId: 'job-123' } });
    });

    it('should return all proposals when no filters provided', async () => {
      const mockProposals = [{ id: '1' }, { id: '2' }];
      prisma.proposal.findMany.mockResolvedValue(mockProposals);

      const result = await ProposalService.listProposals();
      expect(result).toEqual(mockProposals);
      expect(prisma.proposal.findMany).toHaveBeenCalledWith({ where: {} });
    });
  });
});