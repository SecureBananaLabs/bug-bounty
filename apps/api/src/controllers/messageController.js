import { createMessageSchema } from "../validators/message.js";
import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = createMessageSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid message request", 400);
  }

  return ok(res, await sendMessage(payload.data), 201);
}
