const proposalService = require('../src/services/proposalService');

describe('ProposalService - Duplicate Prevention', () => {
  beforeEach(() => {
    proposalService.clearProposals();
  });

  test('should create a proposal successfully for a new (jobId, freelancerId) pair', () => {
    const proposal = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      amount: 100,
    });
    expect(proposal).toBeDefined();
    expect(proposal.jobId).toBe('job_1');
    expect(proposal.freelancerId).toBe('freelancer_1');
    expect(proposal.id).toBeDefined();
  });

  test('should reject a duplicate proposal with the same jobId and freelancerId', () => {
    proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      amount: 100,
    });

    expect(() => {
      proposalService.createProposal({
        jobId: 'job_1',
        freelancerId: 'freelancer_1',
        amount: 200,
      });
    }).toThrow('A proposal from freelancer freelancer_1 for job job_1 already exists');
  });

  test('should allow proposals from the same freelancer for different jobs', () => {
    proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      amount: 100,
    });

    const proposal2 = proposalService.createProposal({
      jobId: 'job_2',
      freelancerId: 'freelancer_1',
      amount: 150,
    });
    expect(proposal2).toBeDefined();
    expect(proposal2.jobId).toBe('job_2');
  });

  test('should allow proposals from different freelancers for the same job', () => {
    proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      amount: 100,
    });

    const proposal2 = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_2',
      amount: 200,
    });
    expect(proposal2).toBeDefined();
    expect(proposal2.freelancerId).toBe('freelancer_2');
  });

  test('should reject duplicate on update if jobId/freelancerId changes to existing pair', () => {
    proposalService.createProposal({
      id: 'prop_1',
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      amount: 100,
    });
    const prop2 = proposalService.createProposal({
      id: 'prop_2',
      jobId: 'job_2',
      freelancerId: 'freelancer_2',
      amount: 200,
    });

    // Try to update prop2 to have same (jobId, freelancerId) as prop1
    expect(() => {
      proposalService.updateProposal(prop2.id, {
        jobId: 'job_1',
        freelancerId: 'freelancer_1',
      });
    }).toThrow('A proposal from freelancer freelancer_1 for job job_1 already exists');
  });

  test('should allow update that does not create duplicate', () => {
    const prop = proposalService.createProposal({
      jobId: 'job_1',
      freelancerId: 'freelancer_1',
      amount: 100,
    });

    const updated = proposalService.updateProposal(prop.id, { amount: 150 });
    expect(updated.amount).toBe(150);
  });

  test('should throw error if jobId or freelancerId is missing', () => {
    expect(() => {
      proposalService.createProposal({ amount: 100 });
    }).toThrow('jobId and freelancerId are required');

    expect(() => {
      proposalService.createProposal({ jobId: 'job_1' });
    }).toThrow('jobId and freelancerId are required');
  });
});
