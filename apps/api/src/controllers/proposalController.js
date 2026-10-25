import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals(req.user?.sub));
}

export async function postProposal(req, res) {
  return ok(res, await createProposal(req.body), 201);
}
