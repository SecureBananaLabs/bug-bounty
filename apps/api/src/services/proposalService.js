const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { jobId, freelancerId, coverLetter, bidAmount, estimatedDuration } = payload ?? {};
  const proposal = {
    id: `prp_${Date.now()}`,
    jobId,
    freelancerId,
    coverLetter,
    bidAmount,
    estimatedDuration
  };
  proposals.push(proposal);
  return proposal;
}
