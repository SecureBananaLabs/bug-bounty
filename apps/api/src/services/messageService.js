import { randomUUID } from "node:crypto";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    ...(payload ?? {}),
    id: `msg_${randomUUID()}`,
    sentAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}
