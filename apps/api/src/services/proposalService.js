const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const createdAt = new Date().toISOString();
  const proposal = {
    id: `prp_${Date.now()}`,
    ...payload,
    createdAt
  };
  proposals.push(proposal);
  return proposal;
}
