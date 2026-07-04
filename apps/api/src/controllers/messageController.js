import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res, next) {
  try {
    return ok(res, await listMessages());
  } catch (error) {
    next(error);
  }
}

export async function postMessage(req, res, next) {
  try {
    const payload = createMessageSchema.parse(req.body);
    const result = await sendMessage(payload);
    return ok(res, result, 201);
  } catch (error) {
    next(error);
  }
}
