import { fail, ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const result = await sendMessage(req.body);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 400);
  }
}
