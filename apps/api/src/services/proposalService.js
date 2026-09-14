const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id, ...proposalPayload } = payload;
  const proposal = {
    ...proposalPayload,
    id: `prp_${Date.now()}`
  };
  proposals.push(proposal);
  return proposal;
}
