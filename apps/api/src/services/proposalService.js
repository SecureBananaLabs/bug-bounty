const proposals = [];

export async function listProposals() {
  return [...proposals]; // Defensive copy
}

export async function createProposal(payload) {
  const proposal = {
    id: `prp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...payload
  };
  proposals.push(proposal);
  return proposal;
}
