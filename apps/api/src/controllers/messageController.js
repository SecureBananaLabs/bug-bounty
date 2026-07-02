import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { senderId, receiverId, body } = req.body ?? {};
  if (isBlank(senderId) || isBlank(receiverId) || isBlank(body)) {
    return fail(res, "senderId, receiverId, and body are required", 400);
  }

  return ok(res, await sendMessage(req.body), 201);
}
