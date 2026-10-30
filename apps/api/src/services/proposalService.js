import crypto from "node:crypto";

const proposals = [];

export async function listProposals() {
  return [...proposals];
}

export async function createProposal(payload = {}) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { id: _ignoredId, ...rest } = safePayload;
  const proposal = {
    ...rest,
    id: `prp_${crypto.randomUUID()}`
  };
  proposals.push(proposal);
  return proposal;
}
