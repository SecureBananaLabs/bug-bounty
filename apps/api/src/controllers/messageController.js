<content>
import { ok, badRequest } from '../utils/response.js';
import { createMessageSchema } from '../validators/message.js';
import { createMessage } from '../services/messageService.js';

export async function postMessage(req, res) {
  try {
    const payload = createMessageSchema.parse(req.body);
    return ok(res, await createMessage(payload), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(res, error.message);
    }
    throw error;
  }
}

export async function getMessage(req, res) {
  // Implementation
}

export async function putMessage(req, res) {
  // Implementation
}

export async function deleteMessage(req, res) {
  // Implementation
}