import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { sendMessageSchema } from "../validators/message.js";

export async function getMessages(req, res, next) {
  try {
    return ok(res, await listMessages());
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const validated = sendMessageSchema.parse(req.body);
    const message = await sendMessage(validated);
    return ok(res, message, 201);
  } catch (err) {
    next(err);
  }
}
