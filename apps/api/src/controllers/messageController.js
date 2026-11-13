import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { sendMessageSchema } from "../validators/index.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const payload = sendMessageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (err) {
    if (err.name === "ZodError") {
      return fail(res, "Validation failed", 400);
    }
    throw err;
  }
}
