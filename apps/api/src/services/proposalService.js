// TODO: MIGRATE to Prisma — proposals are currently stored in volatile memory.
// All financial bids are lost on server restart. Replace with:
//   import { prisma } from "@securebanana/db";
//   prisma.proposal.create(...) / prisma.proposal.findMany(...)
const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  // Validate bidAmount to prevent negative/zero/non-numeric bids
  if (typeof payload.bidAmount !== "number" || !Number.isFinite(payload.bidAmount) || payload.bidAmount <= 0) {
    throw new Error("bidAmount must be a positive number");
  }
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
