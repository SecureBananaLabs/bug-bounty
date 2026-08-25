import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const { estimatedDuration } = req.body || {};
  if (estimatedDuration === undefined || estimatedDuration === null || typeof estimatedDuration !== "number" || estimatedDuration <= 0) {
    return fail(res, "estimatedDuration is required", 400);
  }
  return ok(res, await createProposal(req.body), 201);
}
