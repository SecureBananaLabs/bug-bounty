import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = createMessageSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(
      res,
      "Message payload must include recipientId and body",
      400
    );
  }

  return ok(res, await sendMessage(payload.data), 201);
}
