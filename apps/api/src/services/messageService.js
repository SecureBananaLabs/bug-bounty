import crypto from "crypto";
const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { id: `${m.group(1)}_${crypto.randomUUID()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
