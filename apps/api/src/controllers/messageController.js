import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const body = req.body?.body;
  const senderId = req.body?.senderId;
  if (!body || typeof body !== "string" || !body.trim()) {
    return fail(res, "Message body is required and must be a non-empty string", 400);
  }
  if (!senderId || typeof senderId !== "string" || !senderId.trim()) {
    return fail(res, "senderId is required and must be a non-empty string", 400);
  }
  return ok(res, await sendMessage({ body: body.trim(), senderId: senderId.trim() }), 201);
}