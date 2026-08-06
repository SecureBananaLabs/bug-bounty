const proposals = [];

export async function listProposalsForUser(userId) {
  if (!userId) {
    throw new Error("userId is required to list proposals");
  }

  return proposals.filter(
    (proposal) => proposal.freelancerId === userId || proposal.clientId === userId
  );
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}

export function resetProposalsForTests() {
  proposals.length = 0;
}
