import { randomUUID } from "node:crypto";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  // Date.now() only moves once a millisecond, so two messages created in the
  // same tick used to share an id and the later one overwrote the earlier one.
  const message = { id: `msg_${randomUUID()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
