const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _ignoredId, ...messagePayload } = payload;
  const message = { id: `msg_${Date.now()}`, ...messagePayload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
