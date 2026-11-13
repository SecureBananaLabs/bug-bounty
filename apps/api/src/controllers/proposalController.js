import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals, getProposalById } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  return ok(res, await createProposal(req.body), 201);
}

export async function getProposal(req, res) {
  const proposal = await getProposalById(req.params.id);
  if (!proposal) {
    return fail(res, "Proposal not found", 404);
  }
  return ok(res, proposal);
}
