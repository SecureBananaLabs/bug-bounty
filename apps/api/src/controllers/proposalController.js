import { fail, ok } from "../utils/response.js";
import { createProposal, DuplicateProposalError, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  try {
    return ok(res, await createProposal(req.body), 201);
  } catch (error) {
    if (error instanceof DuplicateProposalError) {
      return fail(res, error.message, 409);
    }

    throw error;
  }
}
