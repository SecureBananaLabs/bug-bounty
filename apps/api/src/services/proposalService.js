const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  // Server-owned `createdAt` so caller-supplied values cannot control the
  // returned timestamp. Strip any incoming `createdAt` from the payload first
  // and assign the canonical ISO string at the storage boundary.
  const { createdAt: _ignoredCreatedAt, ...rest } = payload ?? {};
  const proposal = {
    id: `prp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...rest,
  };
  proposals.push(proposal);
  return proposal;
}
