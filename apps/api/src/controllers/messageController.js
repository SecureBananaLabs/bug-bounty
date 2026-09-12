import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { parsePagination, paginate } from "../utils/pagination.js";

export async function getMessages(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listMessages({ skip, limit });
  return ok(res, paginate(items, total, page, limit));
}

export async function postMessage(req, res) {
  return ok(res, await sendMessage(req.body), 201);
}
