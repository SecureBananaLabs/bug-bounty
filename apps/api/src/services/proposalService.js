const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const createdAt = new Date().toISOString();
  const proposal = { ...payload, id: `prp_${Date.now()}`, createdAt };
  proposals.push(proposal);
  return proposal;
}
