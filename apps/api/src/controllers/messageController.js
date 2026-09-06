import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { messageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = messageSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.flatten(), 422);
  }
  return ok(res, await sendMessage(result.data), 201);
}
