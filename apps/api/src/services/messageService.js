import { createEntityId } from "../utils/ids.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { id: createEntityId("msg"), ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
