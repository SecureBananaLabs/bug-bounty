import { randomUUID } from "node:crypto";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${randomUUID()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
