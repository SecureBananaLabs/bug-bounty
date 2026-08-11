const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id, ...cleanPayload } = payload;
  const proposal = { id: `prp_${Date.now()}`, ...cleanPayload };
  proposals.push(proposal);
  return proposal;
}
