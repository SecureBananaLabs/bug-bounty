import { ok, fail } from "../utils/response.js";
import { sendMessageSchema } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return fail(res, message, 400);
  }
  return ok(res, await sendMessage(parsed.data), 201);
}
