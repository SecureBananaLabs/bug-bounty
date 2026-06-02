import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { sendMessageSchema } from "../validators/review.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = sendMessageSchema.parse(req.body);
  // Sender identity bound to JWT user — prevents senderId spoofing.
  return ok(res, await sendMessage({ ...payload, senderId: req.user.sub }), 201);
}

