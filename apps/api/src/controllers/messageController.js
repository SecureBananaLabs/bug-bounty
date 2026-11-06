import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = createMessageSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  const { content, recipientId, jobId } = result.data;
  return ok(res, await sendMessage({ content, recipientId, jobId }), 201);
}
