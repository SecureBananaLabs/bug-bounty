const proposals = [];

export class DuplicateProposalError extends Error {
  constructor(jobId, freelancerId) {
    super(`Proposal already exists for job ${jobId} and freelancer ${freelancerId}`);
    this.name = "DuplicateProposalError";
  }
}

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const duplicate = proposals.some(
    (proposal) => proposal.jobId === payload.jobId && proposal.freelancerId === payload.freelancerId
  );
  if (duplicate) {
    throw new DuplicateProposalError(payload.jobId, payload.freelancerId);
  }

  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
