import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { sendMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = sendMessageSchema.safeParse(req.body);

  if (!payload.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: payload.error.issues
    });
  }

  return ok(res, await sendMessage(payload.data), 201);
}
