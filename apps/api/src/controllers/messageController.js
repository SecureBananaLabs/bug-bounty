import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  // senderId must come from the verified JWT, not from the request body.
  // Trusting req.body.senderId allows any authenticated user to impersonate
  // another sender — a classic IDOR: I can send messages as any user ID.
  const payload = { ...req.body, senderId: req.user.sub };
  return ok(res, await sendMessage(payload), 201);
}

