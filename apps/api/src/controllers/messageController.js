import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  if (req.body?.senderId && req.body.senderId === req.body.receiverId) {
    return fail(res, "Sender and receiver must be different users", 400);
  }

  return ok(res, await sendMessage(req.body), 201);
}
