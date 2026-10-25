import { ZodError } from "zod";
import { ok, fail } from "../utils/response.js";
import { createMessageSchema } from "../validators/message.js";
import { listMessages, sendMessage } from "../services/messageService.js";

export async function getMessages(req, res) {
  return ok(res, await listMessages());
}

export async function postMessage(req, res) {
  try {
    const payload = createMessageSchema.parse(req.body);
    return ok(res, await sendMessage(payload), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: "error",
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    throw error;
  }
}
