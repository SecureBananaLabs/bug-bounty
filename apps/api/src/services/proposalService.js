const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id, ...rest } = payload || {};
  const proposal = { ...rest, id: `prp_${Date.now()}` };
  proposals.push(proposal);
  return proposal;
}
