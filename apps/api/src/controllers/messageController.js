import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";
import { ZodError } from "zod";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res, next) {
  try {
    const payload = createMessageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (err) {
    if (err instanceof ZodError || err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: err.issues
      });
    }
    if (next) return next(err);
    throw err;
  }
}
