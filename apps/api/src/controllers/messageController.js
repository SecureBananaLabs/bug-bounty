import { ok, fail } from "../utils/response.js";
import { createMessageSchema } from "../validators/message.js";
import { createMessage, listMessages } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const payload = createMessageSchema.parse(req.body);
    return ok(res, await createMessage(payload), 201);
  } catch (error) {
    if (error.name === "ZodError") {
      return fail(res, error.errors.map(e => e.message).join(", "), 400);
    }
    throw error;
  }
}
