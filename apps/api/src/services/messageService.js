import { randomUUID } from "node:crypto";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    id: `msg_${randomUUID()}`,
    ...payload,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
