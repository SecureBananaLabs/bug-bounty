import { fail, ok } from "../utils/response.js";
import { validateCreateProposal } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const { valid, data, message } = validateCreateProposal(req.body);

  if (!valid) {
    return fail(res, message, 400);
  }

  return ok(res, await createProposal(data), 201);
}
