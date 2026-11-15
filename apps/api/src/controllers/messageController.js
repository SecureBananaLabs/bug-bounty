import { z } from "zod";
import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

const sendMessageSchema = z.object({
  senderId: z.string().min(1),
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000)
});

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = sendMessageSchema.parse(req.body);
  return ok(res, await sendMessage(payload), 201);
}
