const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { ...payload, id: `prp_${Date.now()}`, };
  proposals.push(proposal);
  return proposal;
}
