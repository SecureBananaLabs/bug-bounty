const proposals = [];

export async function listProposals() {
  // Callers sort and splice the value they receive, so the shared array has
  // to be handed over as an independent snapshot.
  return [...proposals];
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
