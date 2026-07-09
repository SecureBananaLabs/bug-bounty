import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res, next) {
  try {
    const { senderId, receiverId } = req.body;
    if (senderId && receiverId && senderId === receiverId) {
      return fail(res, "Sender and receiver must be different", 400);
    }
    return ok(res, await sendMessage(req.body), 201);
  } catch (err) {
    return next(err);
  }
}
