import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages(req.user.id));
}

export async function postMessage(req, res) {
  return ok(res, await sendMessage(req.body), 201);
}
