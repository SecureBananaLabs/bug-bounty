import { cloneRecord, cloneRecords } from "../utils/records.js";

const messages = [];

export async function listMessages() {
  return cloneRecords(messages);
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return cloneRecord(message);
}
