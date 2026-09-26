const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _ignoredId, ...rest } = payload;
  const message = { id: `msg_${Date.now()}`, ...rest, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
