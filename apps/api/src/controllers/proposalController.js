import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  if (
    req.body?.estimatedDuration === undefined ||
    req.body?.estimatedDuration === null ||
    req.body?.estimatedDuration === ""
  ) {
    return fail(res, "estimatedDuration is required", 400);
  }

  return ok(res, await createProposal(req.body), 201);
}
