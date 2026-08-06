const proposals = [];

export class DuplicateProposalError extends Error {
  constructor() {
    super("Freelancer already submitted a proposal for this job");
    this.name = "DuplicateProposalError";
  }
}

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const duplicate = proposals.some(
    (proposal) => proposal.jobId === payload?.jobId && proposal.freelancerId === payload?.freelancerId
  );

  if (duplicate) {
    throw new DuplicateProposalError();
  }

  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
