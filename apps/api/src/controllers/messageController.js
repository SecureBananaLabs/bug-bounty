import { ok } from "../utils/response.js";
import { createMessage, listMessages } from "../services/messageService.js";
import { createMessageSchema } from "./message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = createMessageSchema.parse(req.body);
  return ok(res, await createMessage(payload), 201);
}
