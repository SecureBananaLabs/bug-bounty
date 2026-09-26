import { snapshotList } from "./listSnapshot.js";

const messages = [];

export async function listMessages() {
  return snapshotList(messages);
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
