import { z } from "zod";
import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

const createProposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  estimatedDuration: z.number().positive(),
  budget: z.number().positive(),
  description: z.string().min(1).max(2000)
});

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const payload = createProposalSchema.parse(req.body);
  return ok(res, await createProposal(payload), 201);
}
