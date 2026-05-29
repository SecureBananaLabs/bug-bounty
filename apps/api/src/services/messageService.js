import { snapshotRecords } from "./snapshot.js";

const messages = [];

export async function listMessages() {
  return snapshotRecords(messages);
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
