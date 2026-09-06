const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  // eslint-disable-next-line no-unused-vars
  const { id: _id, ...safe } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...safe };
  proposals.push(proposal);
  return proposal;
}
