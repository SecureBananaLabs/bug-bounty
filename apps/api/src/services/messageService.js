import { snapshotRecord } from "./recordSnapshot.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = snapshotRecord({ id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() });
  messages.push(message);
  return snapshotRecord(message);
}
