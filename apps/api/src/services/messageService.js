import { createPublicId } from "../utils/publicId.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { id: createPublicId("msg"), ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
