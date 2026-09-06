import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { validateMessage } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const validation = validateMessage(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      error: "Validation Failed",
      details: validation.error.format()
    });
  }

  return ok(res, await sendMessage(validation.data), 201);
}
