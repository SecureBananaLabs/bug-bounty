import { fail, ok } from "../utils/response.js";
import { createMessageSchema } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = createMessageSchema.safeParse(req.body);

  if (!result.success) {
    return fail(res, "Invalid message payload", 400);
  }

  return ok(res, await sendMessage(result.data), 201);
}
