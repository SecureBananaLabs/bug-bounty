const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const id = `msg_${Date.now()}`;
  const message = { id, ...payload, sentAt: new Date().toISOString() };
  // Ensure the generated id is not overridden by the payload
  delete message.id;
  messages.push({ id, ...payload, sentAt: new Date().toISOString() });
  return { id, ...payload, sentAt: new Date().toISOString() };
}