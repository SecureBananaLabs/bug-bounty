import { fail, ok } from "../utils/response.js";
import { createProposal, listProposalsForUser } from "../services/proposalService.js";

export async function getProposals(req, res) {
  if (!req.user) {
    return fail(res, "Unauthorized", 401);
  }

  const userId = req.user.sub;
  if (!userId) {
    return fail(res, "Unauthorized", 401);
  }

  return ok(res, await listProposalsForUser(userId));
}

export async function postProposal(req, res) {
  return ok(res, await createProposal(req.body), 201);
}
