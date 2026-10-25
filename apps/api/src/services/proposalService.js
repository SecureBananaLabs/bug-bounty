const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = {
    jobId: payload.jobId,
    coverLetter: payload.coverLetter,
    bidAmount: payload.bidAmount,
    estimatedDuration: payload.estimatedDuration,
    id: `prp_${Date.now()}`
  };
  proposals.push(proposal);
  return proposal;
}
