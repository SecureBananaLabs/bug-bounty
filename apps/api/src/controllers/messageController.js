import { ok, fail } from "../utils/response.js";
import { createMessageSchema } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues[0]?.message ?? "Invalid message payload", 400);
  }

  return ok(res, await sendMessage(parsed.data), 201);
}
