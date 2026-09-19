const proposals = [];

export async function listProposals({ skip = 0, limit = 20 } = {}) {
  return { items: proposals.slice(skip, skip + limit), total: proposals.length };
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
