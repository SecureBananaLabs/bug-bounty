import { snapshotRecord } from "./snapshot.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = snapshotRecord({ id: `prp_${Date.now()}`, ...payload });
  proposals.push(proposal);
  return snapshotRecord(proposal);
}
