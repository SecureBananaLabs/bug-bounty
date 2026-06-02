const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  // id must come after spread to prevent client from injecting a chosen id.
  const proposal = { ...payload, id: `prp_${Date.now()}` };
  proposals.push(proposal);
  return proposal;
}

