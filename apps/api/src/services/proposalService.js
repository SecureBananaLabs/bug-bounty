const proposals = [];

export class DuplicateProposalError extends Error {
  constructor(jobId, freelancerId) {
    super(`Freelancer ${freelancerId} already submitted a proposal for job ${jobId}`);
    this.name = "DuplicateProposalError";
    this.statusCode = 409;
  }
}

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  if (payload?.jobId && payload?.freelancerId) {
    const duplicate = proposals.some(
      (proposal) => proposal.jobId === payload.jobId && proposal.freelancerId === payload.freelancerId
    );

    if (duplicate) {
      throw new DuplicateProposalError(payload.jobId, payload.freelancerId);
    }
  }

  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
