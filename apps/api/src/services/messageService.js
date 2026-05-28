import crypto from "crypto";
const messages = [];

export async function listMessages() {
  return messages;
}

export async function createMessage(payload) {
  const message = { id: crypto.randomUUID(), ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}