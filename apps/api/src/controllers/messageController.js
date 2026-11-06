import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { senderId, receiverId, body } = req.body ?? {};

  if (typeof senderId !== "string" || senderId.trim() === "") {
    return fail(res, "senderId is required", 400);
  }

  if (typeof receiverId !== "string" || receiverId.trim() === "") {
    return fail(res, "receiverId is required", 400);
  }

  if (typeof body !== "string" || body.trim() === "") {
    return fail(res, "body is required", 400);
  }

  return ok(res, await sendMessage(req.body), 201);
}
