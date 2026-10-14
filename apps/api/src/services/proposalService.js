const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = {
    id: `prp_${Date.now()}`,
    jobId: payload.jobId,
    freelancerId: payload.freelancerId,
    coverLetter: payload.coverLetter,
    bidAmount: payload.bidAmount,
    estimatedDuration: payload.estimatedDuration
  };
  proposals.push(proposal);
  return proposal;
}
