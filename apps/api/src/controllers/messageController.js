import { z } from "zod";
import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

const schema = z.object({}).passthrough();

export async function postMessage(req, res) {
  return ok(res, await sendMessage(req.body), 201);
}
