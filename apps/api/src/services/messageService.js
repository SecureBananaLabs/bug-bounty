import { copyRecords } from "../utils/recordCopy.js";

const messages = [];

export async function listMessages() {
  return copyRecords(messages);
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
