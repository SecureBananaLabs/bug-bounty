import { snapshotRecord, snapshotRecords } from "../utils/snapshot.js";

const proposals = [];

export async function listProposals() {
  return snapshotRecords(proposals);
}

export async function createProposal(payload) {
  const proposal = snapshotRecord({ id: `prp_${Date.now()}`, ...payload });
  proposals.push(proposal);
  return snapshotRecord(proposal);
}
