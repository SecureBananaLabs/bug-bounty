import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const { description } = req.body || {};
  if (description && typeof description === "string" && description.length > 5000) return fail(res, "Description too long.", 400);

  return ok(res, await createProposal(req.body), 201);
}
