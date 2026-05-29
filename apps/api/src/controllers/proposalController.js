import { ok } from "../utils/response.js";
import { z } from "zod";
import { createProposal, listProposals } from "../services/proposalService.js";

const proposalSchema = z.object({
  jobId: z.string().min(1),
  freelancerId: z.string().min(1),
  coverLetter: z.string().min(1).max(5000),
  bidAmount: z.number().positive()
});

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const payload = proposalSchema.parse(req.body);
  return ok(res, await createProposal(payload), 201);
}
