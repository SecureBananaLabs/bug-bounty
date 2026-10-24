import { ZodError } from "zod";
import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { createMessageSchema } from "../validators/message.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const validated = createMessageSchema.parse(req.body);
    return ok(res, await sendMessage(validated), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
}
