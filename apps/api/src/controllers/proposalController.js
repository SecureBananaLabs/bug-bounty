import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  if (typeof req.body?.estimatedDuration !== "string" || req.body.estimatedDuration.trim() === "") {
    return fail(res, "estimatedDuration is required");
  }

  return ok(res, await createProposal(req.body), 201);
}
