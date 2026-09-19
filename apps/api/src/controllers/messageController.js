import { ZodError } from "zod";
import { ok, fail } from "../utils/response.js";
import { sendMessageSchema } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const payload = sendMessageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map((e) => e.message).join("; "), 400);
    }
    throw err;
  }
}
