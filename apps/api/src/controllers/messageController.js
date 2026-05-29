import { createMessageSchema } from "../validators/message.js";
import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  return ok(res, await sendMessage(createMessageSchema.parse(req.body)), 201);
}
