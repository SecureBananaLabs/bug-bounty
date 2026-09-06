const proposals = [];

export async function listProposals() {
  return proposals.map(p => ({ ...p }));
}

export async function createProposal(payload) {
  const { jobId, coverLetter, bidAmount, estDuration } = payload;
  const proposal = { id: `prp_${Date.now()}`, jobId, coverLetter, bidAmount, estDuration };
  proposals.push(proposal);
  return { ...proposal };
}
