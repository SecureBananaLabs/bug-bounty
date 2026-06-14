import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const { estDuration } = req.body ?? {};
  if (typeof estDuration !== "string" || estDuration.trim().length === 0) {
    return fail(res, "Estimated duration is required", 400);
  }

  return ok(res, await createProposal(req.body), 201);
}
