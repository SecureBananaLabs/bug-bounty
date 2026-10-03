<content>
const { createProposal } = require('./proposalService');

describe('createProposal', () => {
  it('should create a proposal with server-generated id', () => {
    const payload = {
      title: 'Test Proposal',
      description: 'This is a test proposal',
    };
    
    const proposal = createProposal(payload);
    
    // Verify the ID is in the correct format
    expect(proposal.id).toMatch(/^prp_\d+$/);
    
    // Verify the payload fields are preserved
    expect(proposal.title).toBe(payload.title);
    expect(proposal.description).toBe(payload.description);
  });

  it('should not allow client to override server-generated id', () => {
    const payload = {
      id: 'client_supplied_id',
      title: 'Test Proposal',
      description: 'This is a test proposal',
    };
    
    const proposal = createProposal(payload);
    
    // Verify the server-generated ID is used instead of client-supplied one
    expect(proposal.id).not.toBe(payload.id);
    expect(proposal.id).toMatch(/^prp_\d+$/);
    
    // Verify the payload fields are preserved
    expect(proposal.title).toBe(payload.title);
    expect(proposal.description).toBe(payload.description);
  });

  it('should preserve all payload fields except id', () => {
    const payload = {
      id: 'should_be_ignored',
      title: 'Test Proposal',
      description: 'This is a test proposal',
      amount: 1000,
      userId: 'user123',
    };
    
    const proposal = createProposal(payload);
    
    // Verify the server-generated ID is used
    expect(proposal.id).toMatch(/^prp_\d+$/);
    
    // Verify all other payload fields are preserved
    expect(proposal.title).toBe(payload.title);
    expect(proposal.description).toBe(payload.description);
    expect(proposal.amount).toBe(payload.amount);
    expect(proposal.userId).toBe(payload.userId);
  });
});
</content>