import { copyRecord, copyRecords } from "./copyRecord.js";

const messages = [];

export async function listMessages() {
  return copyRecords(messages);
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return copyRecord(message);
}
