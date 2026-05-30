import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { parsePagination, paginate } from "../utils/pagination.js";

export async function getProposals(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listProposals({ skip, limit });
  return ok(res, paginate(items, total, page, limit));
}

export async function postProposal(req, res) {
  return ok(res, await createProposal(req.body), 201);
}
