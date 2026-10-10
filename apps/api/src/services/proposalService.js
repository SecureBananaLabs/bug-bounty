const proposals = [];

export class DuplicateProposalError extends Error {
  constructor(jobId, freelancerId) {
    super(`Freelancer ${freelancerId} already has a proposal for job ${jobId}`);
    this.name = "DuplicateProposalError";
  }
}

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const hasProposalIdentity = payload.jobId != null && payload.freelancerId != null;
  const existingProposal = hasProposalIdentity
    ? proposals.find(
        (proposal) =>
          proposal.jobId === payload.jobId &&
          proposal.freelancerId === payload.freelancerId
      )
    : null;

  if (existingProposal) {
    throw new DuplicateProposalError(payload.jobId, payload.freelancerId);
  }

  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
