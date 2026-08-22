import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { validateCreateMessage } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const validation = validateCreateMessage(req.body);
  if (!validation.valid) {
    return fail(res, validation.error, 400);
  }
  return ok(res, await sendMessage(validation.data), 201);
}
