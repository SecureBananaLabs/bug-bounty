import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { messageSchema, filterSystemFields } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  // Validate input against strict schema
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid input", 400, parsed.error.issues);
  }

  // Strip any system-controlled fields the user shouldn't override
  const clean = filterSystemFields(parsed.data);

  return ok(res, await sendMessage(clean), 201);
}
