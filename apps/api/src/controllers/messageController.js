import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

function isNonBlankString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { body, senderId, receiverId } = req.body ?? {};
  if (!isNonBlankString(body) || !isNonBlankString(senderId) || !isNonBlankString(receiverId)) {
    return fail(res, "body, senderId, and receiverId are required", 400);
  }

  return ok(res, await sendMessage(req.body), 201);
}
