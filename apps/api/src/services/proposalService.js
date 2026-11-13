const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id: _id, ...rest } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...rest };
  proposals.push(proposal);
  return proposal;
}
