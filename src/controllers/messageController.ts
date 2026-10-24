import type { Request, Response } from "express";
import { ZodError } from "zod";
import { createMessageSchema } from "../schemas/messageSchema";
import { sendMessage } from "../services/messageService";

function validationEnvelope(error: ZodError) {
  return {
    error: {
      code: "INVALID_MESSAGE_PAYLOAD",
      message: "Request body failed message creation validation.",
      details: error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        message: issue.message,
        code: issue.code,
      })),
    },
  };
}

export function createMessage(req: Request, res: Response): Response {
  const parsed = createMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(validationEnvelope(parsed.error));
  }

  try {
    const message = sendMessage(parsed.data);
    return res.status(201).json({ data: message });
  } catch {
    return res.status(500).json({
      error: {
        code: "MESSAGE_PERSISTENCE_FAILED",
        message: "Unable to persist message.",
      },
    });
  }
}
