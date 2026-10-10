import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = createMessageSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.issues[0]?.message ?? "Invalid message payload");
  }

  return ok(res, await sendMessage(result.data), 201);
}
