import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProposals = asyncHandler(async (req, res) => {
  return ok(res, await listProposals());
});

export const postProposal = asyncHandler(async (req, res) => {
  return ok(res, await createProposal(req.body), 201);
});
