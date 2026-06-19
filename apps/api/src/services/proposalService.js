const proposals = [];

export async function listProposals() {
  return [...proposals];
}

export async function createProposal(payload) {
  // Server-controlled fields after the spread so they cannot be overridden.
  const proposal = {
    ...payload,
    id: `prp_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  proposals.push(proposal);
  return proposal;
}
