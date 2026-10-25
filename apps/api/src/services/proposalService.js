const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { jobId, freelancerId, coverLetter, estimatedDuration } = payload;
  const proposal = {
    jobId,
    freelancerId,
    coverLetter,
    estimatedDuration,
    id: `prp_${Date.now()}`
  };
  proposals.push(proposal);
  return proposal;
}
