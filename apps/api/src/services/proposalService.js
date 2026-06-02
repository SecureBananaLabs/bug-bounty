const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id: _ignoredId, ...proposalFields } = payload;
  const proposal = { ...proposalFields, id: `prp_${Date.now()}` };
  proposals.push(proposal);
  return proposal;
}
