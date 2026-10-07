const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload, user) {
  const { id, freelancerId, ...proposalFields } = payload;
  const proposal = {
    ...proposalFields,
    id: `prp_${Date.now()}`,
    freelancerId: user.sub
  };
  proposals.push(proposal);
  return proposal;
}
