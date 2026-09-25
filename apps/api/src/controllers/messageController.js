import { ok, fail } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const content = (req.body.content ?? "").toString().trim();
  if (!content) {
    return fail(res, "Message content is required", 400);
  }
  const senderId = req.user?.sub ?? "unknown";
  return ok(res, await sendMessage(senderId, content), 201);
}
