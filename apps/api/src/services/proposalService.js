const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id: _ignored, ...safePayload } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...safePayload };
  proposals.push(proposal);
  return proposal;
}
