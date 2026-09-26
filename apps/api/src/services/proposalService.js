const proposals = [];

function serializeProposal(proposal) {
  return { ...proposal };
}

export async function listProposals() {
  return proposals.map(serializeProposal);
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return serializeProposal(proposal);
}
