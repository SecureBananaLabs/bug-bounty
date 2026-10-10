import { createPrefixedId } from "../utils/id.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { ...payload, id: createPrefixedId("msg"), sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
