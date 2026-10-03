import { fail } from "../utils/response.js";
import { ok } from "../utils/response.js";
import { createMessage, listMessages } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const result = createMessageSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors.map(e => e.message).join(", "), 400);
  }
  return ok(res, await createMessage(result.data), 201);
}
