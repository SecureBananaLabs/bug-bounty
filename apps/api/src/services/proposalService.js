const proposals = [];

export async function listProposals() {
  return proposals.slice();
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
