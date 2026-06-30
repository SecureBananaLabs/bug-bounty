const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = {
    id: `prp_${Date.now()}`,
    coverLetter: payload.coverLetter,
    bidAmount: payload.bidAmount,
    estDuration: payload.estDuration,
    jobId: payload.jobId,
    freelancerId: payload.freelancerId
  };
  proposals.push(proposal);
  return proposal;
}
