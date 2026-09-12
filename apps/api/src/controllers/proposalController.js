import { z } from "zod";
import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

const schema = z.object({ jobId: z.string().min(1), coverLetter: z.string().min(10), bidAmount: z.number().positive(), estimatedDuration: z.string().min(1) }).strict();

export async function postProposal(req, res) {
  let payload;
  try {
    payload = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }
  return ok(res, await createProposal(payload));
}
