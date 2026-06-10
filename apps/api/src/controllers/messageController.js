import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const payload = createMessageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (e) {
    return fail(res, e.message, 400);
  }
}
