const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id: _ignored, ...safe } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...safe };
  proposals.push(proposal);
  return proposal;
}
