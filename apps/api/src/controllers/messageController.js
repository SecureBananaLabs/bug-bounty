import { ok } from "../utils/response.js";
const { postMessageSchema } = require('../validators/message');
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
    const parsed = postMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
      });
    }
    const message = await messageService.sendMessage(parsed.data);
}

export async function postMessage(req, res) {
  return ok(res, await sendMessage(req.body), 201);
}
