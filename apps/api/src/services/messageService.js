import { createServiceId } from "../utils/ids.js";

const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { ...payload, id: createServiceId("msg"), sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
