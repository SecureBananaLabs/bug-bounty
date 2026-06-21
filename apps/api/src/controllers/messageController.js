import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const { senderId, receiverId, body } = req.body;
  
  if (!senderId || !receiverId || !body || typeof body !== 'string' || body.trim() === '') {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid required fields: senderId, receiverId, and body are required."
    });
  }

  return ok(res, await sendMessage(req.body), 201);
}
