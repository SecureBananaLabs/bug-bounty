const proposals = [];

export async function listProposals() {
  // Callers trim and sort the list in place, so they must not be handed the
  // module array itself and end up rewriting stored state.
  return [...proposals];
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
