const proposals = [];

export async function listProposals(userId) {
  if (!userId) {
    return [];
  }

  return proposals.filter((proposal) => proposal.freelancerId === userId || proposal.clientId === userId);
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
