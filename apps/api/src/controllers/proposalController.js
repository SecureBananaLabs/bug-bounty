import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res, next) {
  try {
    return ok(res, await listProposals());
  } catch (error) {
    return next(error);
  }
}

export async function postProposal(req, res, next) {
  try {
    return ok(res, await createProposal(req.body), 201);
  } catch (error) {
    return next(error);
  }
}
