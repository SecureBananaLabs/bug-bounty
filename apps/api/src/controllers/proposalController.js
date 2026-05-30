import { ok } from "../utils/response.js";
import { proposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const payload = proposalSchema.parse(req.body);
  return ok(res, await createProposal(payload), 201);
}