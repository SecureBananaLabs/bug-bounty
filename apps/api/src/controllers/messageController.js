import { ZodError } from "zod";
import { ok } from "../utils/response.js";
import { sendMessageSchema } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const payload = sendMessageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    throw err;
  }
}
