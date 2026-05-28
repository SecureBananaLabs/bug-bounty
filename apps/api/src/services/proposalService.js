import crypto from "crypto";
const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: `${m.group(1)}_${crypto.randomUUID()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
