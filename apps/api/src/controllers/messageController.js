import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { messageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res, next) {
  try {
    const payload = messageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (err) {
    return next(err);
  }
}
