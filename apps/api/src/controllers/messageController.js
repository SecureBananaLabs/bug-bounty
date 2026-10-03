import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/content.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = createMessageSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Invalid message payload");
  }

  return ok(res, await sendMessage(result.data), 201);
}
