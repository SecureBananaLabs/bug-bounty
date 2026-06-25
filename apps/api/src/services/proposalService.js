const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id, ...proposalPayload } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...proposalPayload };
  proposals.push(proposal);
  return proposal;
}
