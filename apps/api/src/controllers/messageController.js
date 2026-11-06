import { fail, ok } from "../utils/response.js";
import {
  SelfMessageError,
  listMessages,
  sendMessage
} from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    return ok(res, await sendMessage(req.body), 201);
  } catch (error) {
    if (error instanceof SelfMessageError) {
      return fail(res, error.message, 400);
    }

    throw error;
  }
}
