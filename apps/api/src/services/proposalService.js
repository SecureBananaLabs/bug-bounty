import crypto from "crypto";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
