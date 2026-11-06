let proposals = [];

export async function listProposals() {
  return [...proposals];
}

export async function getProposalById(id) {
  return proposals.find((p) => p.id === id) || null;
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}

export function _resetProposals() {
  proposals = [];
}
