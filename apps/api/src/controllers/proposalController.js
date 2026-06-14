import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  if (!req.body.estimated_duration) {
    return res.status(400).json({ error: "Proposal requires estimated_duration" });
  }
  return ok(res, await createProposal(req.body), 201);
}
