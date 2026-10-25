const proposals = [];

export async function listProposals() {
  return proposals.map((p) => ({ ...p }));
}

export async function createProposal(payload) {
  const { id: _id, ...safePayload } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...safePayload };
  proposals.push(proposal);
  return { ...proposal };
}
