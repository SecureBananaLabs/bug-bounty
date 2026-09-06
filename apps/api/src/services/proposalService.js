const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  // Fix #5203: Prevent caller from overriding server-generated id
  const { id: _ignored, ...safePayload } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...safePayload };
  proposals.push(proposal);
  return proposal;
}
