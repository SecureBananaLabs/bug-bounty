import crypto from "node:crypto";

const proposals = [];

export async function listProposals() {
  return [...proposals];
}

export async function createProposal(payload = {}) {
  const { id: _ignoredId, ...rest } = payload ?? {};
  const proposal = {
    ...rest,
    id: `prp_${crypto.randomUUID()}`
  };
  proposals.push(proposal);
  return proposal;
}
