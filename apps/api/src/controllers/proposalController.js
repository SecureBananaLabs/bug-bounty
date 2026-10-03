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
  if (req.user && req.user.id !== payload.freelancerId) {
    return res.status(403).json({ success: false, message: "Cannot create proposal for another freelancer" });
  }
  return ok(res, await createProposal(payload), 201);
}
