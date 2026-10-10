import { copyRecords } from "../utils/recordCopy.js";

const proposals = [];

export async function listProposals() {
  return copyRecords(proposals);
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
