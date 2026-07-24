import { z } from "zod";
import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

const schema = z.object({ content: z.string().min(1), recipientId: z.string().min(1), jobId: z.string().optional() }).strict();

export async function postMessage(req, res) {
  let payload;
  try {
    payload = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }
  return ok(res, await sendMessage(payload));
}
