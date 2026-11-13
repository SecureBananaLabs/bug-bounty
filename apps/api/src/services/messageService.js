import { createId } from "../utils/ids.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id, sentAt, ...messagePayload } = payload;
  const message = { ...messagePayload, id: createId("msg"), sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}

export function resetMessages() {
  messages.length = 0;
}
