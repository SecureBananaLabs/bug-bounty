import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const coverLetter = req.body?.coverLetter;

  if (typeof coverLetter !== "string" || coverLetter.trim() === "") {
    return fail(res, "coverLetter is required", 400);
  }

  return ok(res, await createProposal(req.body), 201);
}
