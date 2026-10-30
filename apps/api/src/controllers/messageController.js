import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res, next) {
  try {
    const validated = createMessageSchema.parse(req.body);
    const result = await sendMessage(validated);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}
