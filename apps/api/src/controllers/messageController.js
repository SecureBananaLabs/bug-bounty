import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  // Derive senderId from authenticated user, ignore client-supplied value
  const { senderId: _senderId, ...rest } = req.body;
  const payload = { ...rest, senderId: req.user.sub };
  return ok(res, await sendMessage(payload), 201);
}
