import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const bidAmount = req.body?.bidAmount;
  const parsedBidAmount = typeof bidAmount === "number" ? bidAmount : Number(bidAmount);

  if (!Number.isFinite(parsedBidAmount) || parsedBidAmount <= 0) {
    return fail(res, "bidAmount must be a positive number", 400);
  }

  return ok(res, await createProposal(req.body), 201);
}
