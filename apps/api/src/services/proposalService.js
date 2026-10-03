import { cloneRecord, cloneRecords } from "../utils/records.js";

const proposals = [];

export async function listProposals() {
  return cloneRecords(proposals);
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return cloneRecord(proposal);
}
