const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { jobId, freelancerId, coverLetter, estimatedDuration } = payload ?? {};
  const proposal = {
    id: `prp_${Date.now()}`,
    jobId,
    freelancerId,
    coverLetter,
    estimatedDuration
  };
  proposals.push(proposal);
  return proposal;
}
