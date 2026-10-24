import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage, getMessageById } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  return ok(res, await sendMessage(req.body), 201);
}

export async function getMessage(req, res) {
  const message = await getMessageById(req.params.id);
  if (!message) {
    return fail(res, "Message not found", 404);
  }
  return ok(res, message);
}
