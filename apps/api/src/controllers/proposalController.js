import { fail, ok } from "../utils/response.js";
import { listProposals, sendProposal } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  try {
    const result = await sendProposal(req.body);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}
