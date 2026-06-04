const { createProposal } = require('./proposalController');
const proposalService = require('../services/proposalService');

jest.mock('../services/proposalService');

describe('proposalController - createProposal', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  const validProposal = {
    jobId: 'job_123',
    freelancerId: 'usr_456',
    coverLetter: 'I can complete this safely.',
    bidAmount: 250,
    estDuration: '2 weeks',
  };

  it('should create a proposal with valid data', async () => {
    req.body = validProposal;
    proposalService.createProposal.mockResolvedValue({ id: 'prop_1', ...validProposal });

    await createProposal(req, res, next);

    expect(proposalService.createProposal).toHaveBeenCalledWith(validProposal);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'prop_1', ...validProposal });
  });

  it('should reject missing estDuration', async () => {
    req.body = {
      jobId: 'job_123',
      freelancerId: 'usr_456',
      coverLetter: 'I can complete this safely.',
      bidAmount: 250,
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['estDuration is required and must be a non-empty string'],
    });
  });

  it('should reject blank estDuration', async () => {
    req.body = {
      jobId: 'job_123',
      freelancerId: 'usr_456',
      coverLetter: 'I can complete this safely.',
      bidAmount: 250,
      estDuration: '   ',
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['estDuration is required and must be a non-empty string'],
    });
  });

  it('should reject missing jobId', async () => {
    req.body = {
      freelancerId: 'usr_456',
      coverLetter: 'I can complete this safely.',
      bidAmount: 250,
      estDuration: '2 weeks',
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['jobId is required and must be a non-empty string'],
    });
  });

  it('should reject missing freelancerId', async () => {
    req.body = {
      jobId: 'job_123',
      coverLetter: 'I can complete this safely.',
      bidAmount: 250,
      estDuration: '2 weeks',
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['freelancerId is required and must be a non-empty string'],
    });
  });

  it('should reject missing coverLetter', async () => {
    req.body = {
      jobId: 'job_123',
      freelancerId: 'usr_456',
      bidAmount: 250,
      estDuration: '2 weeks',
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['coverLetter is required and must be a non-empty string'],
    });
  });

  it('should reject missing bidAmount', async () => {
    req.body = {
      jobId: 'job_123',
      freelancerId: 'usr_456',
      coverLetter: 'I can complete this safely.',
      estDuration: '2 weeks',
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['bidAmount is required and must be a positive number'],
    });
  });

  it('should reject non-positive bidAmount', async () => {
    req.body = {
      jobId: 'job_123',
      freelancerId: 'usr_456',
      coverLetter: 'I can complete this safely.',
      bidAmount: 0,
      estDuration: '2 weeks',
    };

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: ['bidAmount is required and must be a positive number'],
    });
  });

  it('should reject multiple missing fields', async () => {
    req.body = {};

    await createProposal(req, res, next);

    expect(proposalService.createProposal).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: expect.arrayContaining([
        'jobId is required and must be a non-empty string',
        'freelancerId is required and must be a non-empty string',
        'coverLetter is required and must be a non-empty string',
        'bidAmount is required and must be a positive number',
        'estDuration is required and must be a non-empty string',
      ]),
    });
  });

  it('should call next on service error', async () => {
    req.body = validProposal;
    const error = new Error('Database error');
    proposalService.createProposal.mockRejectedValue(error);

    await createProposal(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
