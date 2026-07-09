const proposalService = require('../src/services/proposalService');

describe('ProposalService - Duplicate Prevention', () => {
  beforeEach(() => {
    proposalService.clear();
  });

  test('should create a proposal successfully', () => {
    const proposal = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      coverLetter: 'I am interested',
      rate: 100,
    });

    expect(proposal).toHaveProperty('id');
    expect(proposal.jobId).toBe('job_1');
    expect(proposal.freelancerId).toBe('freelancer_1');
    expect(proposal.status).toBe('active');
  });

  test('should reject duplicate proposal from same freelancer for same job', () => {
    proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      coverLetter: 'First bid',
      rate: 100,
    });

    expect(() => {
      proposalService.createProposal({
        jobId: 'job_1',
        freelancerId: 'freelancer_1',
        coverLetter: 'Second bid',
        rate: 120,
      });
    }).toThrow('Freelancer freelancer_1 has already submitted a proposal for job job_1');
  });

  test('should allow proposals from different freelancers for same job', () => {
    const p1 = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      coverLetter: 'Bid from A',
      rate: 100,
    });
    const p2 = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_2',
      coverLetter: 'Bid from B',
      rate: 110,
    });

    expect(p1.freelancerId).toBe('freelancer_1');
    expect(p2.freelancerId).toBe('freelancer_2');
    expect(proposalService.getAllProposals()).toHaveLength(2);
  });

  test('should allow proposals from same freelancer for different jobs', () => {
    const p1 = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      coverLetter: 'Bid for job 1',
      rate: 100,
    });
    const p2 = proposalService.createProposal({
      jobId: 'job_2',
      freelancerId: 'freelancer_1',
      coverLetter: 'Bid for job 2',
      rate: 200,
    });

    expect(p1.jobId).toBe('job_1');
    expect(p2.jobId).toBe('job_2');
    expect(proposalService.getAllProposals()).toHaveLength(2);
  });

  test('should return 409 status code in error', () => {
    proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      coverLetter: 'First',
      rate: 100,
    });

    try {
      proposalService.createProposal({
        jobId: 'job_1',
        freelancerId: 'freelancer_1',
        coverLetter: 'Second',
        rate: 150,
      });
    } catch (error) {
      expect(error.statusCode).toBe(409);
    }
  });
});
