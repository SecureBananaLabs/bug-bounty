import { createServiceId } from "../utils/ids.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { ...payload, id: createServiceId("prp") };
  proposals.push(proposal);
  return proposal;
}
