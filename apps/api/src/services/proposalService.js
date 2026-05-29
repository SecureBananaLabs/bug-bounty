const proposals = [];

export async function listProposals(userId) {
  if (userId) {
    return proposals.filter((p) => p.freelancerId === userId || p.clientId === userId);
  }
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
