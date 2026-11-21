import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const { id: _ignoredId, userId: _ignoredUserId, authorId: _ignoredAuthorId, ...payload } =
    req.body ?? {};

  return ok(res, await createProposal({ ...payload, authorId: req.user.sub }), 201);
}
