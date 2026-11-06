import { messageSchema } from "../validators/message.js";
import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const parsed = messageSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "Invalid message payload");
  }

  return ok(res, await sendMessage(parsed.data), 201);
}
