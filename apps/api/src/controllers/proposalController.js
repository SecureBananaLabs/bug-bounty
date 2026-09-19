import { z } from "zod";
import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

const schema = z.object({}).passthrough();

export async function postProposal(req, res) {
  const payload = schema.parse(req.body);
  return ok(res, await createProposal(payload));
}
