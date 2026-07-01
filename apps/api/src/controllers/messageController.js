import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = createMessageSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Message body is required", 400);
  }

  return ok(res, await sendMessage(result.data), 201);
}
