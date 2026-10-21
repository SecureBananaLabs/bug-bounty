import { ok } from "../utils/response.js";
import { getMessageById, listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res, next) {
  try {
    return ok(res, await listMessages());
  } catch (err) {
    next(err);
  }
}

export async function getMessage(req, res, next) {
  try {
    const message = await getMessageById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }
    return ok(res, message);
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    return ok(res, await sendMessage(req.body), 201);
  } catch (err) {
    next(err);
  }
}
