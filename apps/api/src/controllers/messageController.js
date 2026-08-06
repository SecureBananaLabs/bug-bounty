import { fail, ok } from "../utils/response.js";
import { createMessageSchema } from "../validators/body.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, { issues: parsed.error.issues });
  }

  return ok(res, await sendMessage(parsed.data), 201);
}
