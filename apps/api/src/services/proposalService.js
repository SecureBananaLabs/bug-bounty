import crypto from "crypto";

const proposals = [];
let sequence = 0;

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id: _ignoredId, ...data } = payload || {};
  sequence = (sequence + 1) % 1000000;
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const proposal = {
    ...data,
    id: `prp_${Date.now()}_${sequence}_${randomSuffix}`
  };
  proposals.push(proposal);
  return proposal;
}
