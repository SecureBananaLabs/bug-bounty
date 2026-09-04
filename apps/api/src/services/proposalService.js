import { snapshotRecords } from "./snapshot.js";

const proposals = [];

export async function listProposals() {
  return snapshotRecords(proposals);
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
