import { fail, ok } from "../utils/response.js";
import { listMessages, SelfDirectedMessageError, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    return ok(res, await sendMessage(req.body), 201);
  } catch (error) {
    if (error instanceof SelfDirectedMessageError) {
      return fail(res, error.message, 400);
    }
    throw error;
  }
}
