import { fail, ok } from "../utils/response.js";
import { validateCreateMessage } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { valid, data, message } = validateCreateMessage(req.body);

  if (!valid) {
    return fail(res, message, 400);
  }

  return ok(res, await sendMessage(data), 201);
}
