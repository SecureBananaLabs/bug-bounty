import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid message request",
      issues: parsed.error.issues
    });
  }

  return ok(res, await sendMessage(parsed.data), 201);
}
