const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id, ...safePayload } = payload;
  const proposal = { ...safePayload, id: `prp_${Date.now()}` };
  proposals.push(proposal);
  return proposal;
}
