const proposals = [];

export async function listProposals() {
  return [...proposals];
}

export async function createProposal(payload) {
  const serverCreatedAt = new Date().toISOString();
  const proposal = {
    id: `prp_${Date.now()}`,
    ...payload,
    createdAt: serverCreatedAt,
  };
  proposals.push(proposal);
  return proposal;
}
