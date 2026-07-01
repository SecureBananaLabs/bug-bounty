import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  const userId = req.user?.sub;
  if (typeof userId !== "string" || userId.trim() === "") {
    return fail(res, "Unauthorized", 401);
  }

  return ok(res, await listProposals(userId));
}

export async function postProposal(req, res) {
  return ok(res, await createProposal(req.body), 201);
}
