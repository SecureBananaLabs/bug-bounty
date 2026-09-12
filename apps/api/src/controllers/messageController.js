import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { senderId, recipientId, content } = req.body ?? {};

  if (typeof senderId !== "string" || senderId.trim() === "") {
    return fail(res, "senderId is required", 400);
  }

  if (typeof recipientId !== "string" || recipientId.trim() === "") {
    return fail(res, "recipientId is required", 400);
  }

  if (typeof content !== "string" || content.trim() === "") {
    return fail(res, "content is required", 400);
  }

  return ok(res, await sendMessage(req.body), 201);
}
