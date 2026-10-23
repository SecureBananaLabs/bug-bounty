import crypto from "node:crypto";

const messages = [];

export async function listMessages() {
  return [...messages];
}

export async function sendMessage(payload = {}) {
  const { id: _ignoredId, ...rest } = payload ?? {};
  const message = {
    ...rest,
    id: `msg_${crypto.randomUUID()}`,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
