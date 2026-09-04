const proposals = [];
export const PROPOSAL_STATUS = Object.freeze({
  pending: "PENDING"
});

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = {
    ...(payload ?? {}),
    id: `prp_${Date.now()}`,
    status: PROPOSAL_STATUS.pending
  };
  proposals.push(proposal);
  return proposal;
}
