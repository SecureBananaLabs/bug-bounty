import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { content } = req.body || {};
  if (!content || typeof content !== "string" || content.trim().length === 0) return fail(res, "Message content is required.", 400);
  if (content.length > 5000) return fail(res, "Message too long.", 400);

  return ok(res, await sendMessage(req.body), 201);
}
