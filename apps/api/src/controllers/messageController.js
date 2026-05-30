import { z } from "zod";
import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

const messageSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000),
});

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  const payload = messageSchema.parse(req.body);
  return ok(res, await sendMessage(payload), 201);
}