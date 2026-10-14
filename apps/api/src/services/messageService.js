import { createId } from "../utils/id.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { id: createId("msg"), ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
